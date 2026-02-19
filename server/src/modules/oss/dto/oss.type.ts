import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'OSS 表单直传签名信息' })
export class OssType {
  @Field(() => String, { description: '上传 Host' })
  host: string;

  @Field(() => String, { description: '上传策略（Base64）' })
  policy: string;

  @Field(() => String, { description: '签名版本' })
  x_oss_signature_version: string;

  @Field(() => String, { description: '凭证' })
  x_oss_credential: string;

  @Field(() => String, { description: '过期时间（x-oss-date）' })
  expire: string;

  @Field(() => String, { description: '签名' })
  signature: string;

  @Field(() => String, { description: '上传目录前缀' })
  dir: string;

  @Field(() => String, { nullable: true, description: 'STS 临时令牌（可选）' })
  security_token?: string;
}
