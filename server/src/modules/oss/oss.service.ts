import { Injectable } from "@nestjs/common";
import OSS = require('ali-oss')
import { STS } from 'ali-oss';
import { getCredential } from 'ali-oss/lib/common/signUtils';
import { getStandardRegion } from 'ali-oss/lib/common/utils/getStandardRegion';
import { OssType } from "./dto/oss.type";
import { ConfigService } from "@nestjs/config";


@Injectable()
export class OssService {
  constructor(private readonly config: ConfigService) { }
  async getSignature(): Promise<OssType> {
    const sts = new STS({
      accessKeyId: this.config.get<string>('OSS_ACCESS_KEY_ID'),
      accessKeySecret: this.config.get<string>('OSS_ACCESS_KEY_SECRET'),
    });
    // AssumeRole to get temporary credentials
    const result = await sts.assumeRole(
      this.config.get<string>('OSS_STS_ROLE_ARN'),
      '',
      3600,
      'yourRoleSessionName',
    );

    // Extract temporary credentials
    const accessKeyId = result.credentials.AccessKeyId;
    const accessKeySecret = result.credentials.AccessKeySecret;
    const securityToken = result.credentials.SecurityToken;

    // Initialize OSS client with STS token
    const client = new OSS({
      bucket: this.config.get<string>('OSS_BUCKET'), // e.g. examplebucket
      region: this.config.get<string>('OSS_REGION'), // e.g. cn-hangzhou
      accessKeyId,
      accessKeySecret,
      stsToken: securityToken,
      refreshSTSTokenInterval: 0,
      refreshSTSToken: async () => {
        const { accessKeyId, accessKeySecret, securityToken } = await client.getCredential();
        return { accessKeyId, accessKeySecret, stsToken: securityToken };
      },
    });

    // Set signature expiration time: now + 10 minutes
    const date = new Date();
    const expirationDate = new Date(date);
    expirationDate.setMinutes(date.getMinutes() + 10);

    // Format date to ISO 8601 UTC string (YYYYMMDDTHHMMSSZ)
    function padTo2Digits(num: number) {
      return num.toString().padStart(2, '0');
    }
    function formatDateToUTC(d: Date) {
      return (
        d.getUTCFullYear() +
        padTo2Digits(d.getUTCMonth() + 1) +
        padTo2Digits(d.getUTCDate()) +
        'T' +
        padTo2Digits(d.getUTCHours()) +
        padTo2Digits(d.getUTCMinutes()) +
        padTo2Digits(d.getUTCSeconds()) +
        'Z'
      );
    }
    const formattedDate = formatDateToUTC(expirationDate);

    // Generate x-oss-credential
    const credential = getCredential(
      formattedDate.split('T')[0],
      getStandardRegion(client.options.region),
      client.options.accessKeyId,
    );

    // Create policy (minimal required fields)
    const policy: any = {
      expiration: expirationDate.toISOString(),
      conditions: [
        { bucket: client.options.bucket },
        { 'x-oss-credential': credential },
        { 'x-oss-signature-version': 'OSS4-HMAC-SHA256' },
        { 'x-oss-date': formattedDate },
      ],
    };

    // If STS Token exists, add it
    if (client.options.stsToken) {
      policy.conditions.push({ 'x-oss-security-token': client.options.stsToken });
    }

    // Sign policy
    const signature = client.signPostObjectPolicyV4(policy, date);

    // Encode policy to base64
    const policyStr = JSON.stringify(policy);

    return {
      host: `http://${client.options.bucket}.oss-${client.options.region}.aliyuncs.com`,
      policy: Buffer.from(policyStr, 'utf8').toString('base64'),
      x_oss_signature_version: 'OSS4-HMAC-SHA256',
      x_oss_credential: credential,
      expire: formattedDate,
      signature,
      dir: 'image/',
      security_token: client.options.stsToken,
    };
  }
}