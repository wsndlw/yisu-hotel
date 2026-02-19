import { gql } from '@apollo/client';

export const GET_OSS_INFO = gql`
  query GetOssInfo {
    getOssInfo {
      host
      policy
      x_oss_signature_version
      x_oss_credential
      expire
      signature
      dir
      security_token
    }
  }
`;
