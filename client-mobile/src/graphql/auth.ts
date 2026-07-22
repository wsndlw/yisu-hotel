import { gql } from '@apollo/client';

const AUTH_PAYLOAD_FIELDS = gql`
  fragment AuthPayloadFields on AuthPayload {
    accessToken
    user {
      id
      username
      email
      avatarUrl
      role
    }
  }
`;

export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      code
      message
      data {
        ...AuthPayloadFields
      }
    }
  }
  ${AUTH_PAYLOAD_FIELDS}
`;

export const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      code
      message
      data {
        ...AuthPayloadFields
      }
    }
  }
  ${AUTH_PAYLOAD_FIELDS}
`;

export const ME_QUERY = gql`
  query Me {
    me {
      code
      message
      data {
        id
        username
        email
        avatarUrl
        role
      }
    }
  }
`;

export const SEND_EMAIL_CODE_MUTATION = gql`
  mutation SendEmailCode($email: String!) {
    sendEmailCode(email: $email) {
      code
      message
    }
  }
`;

export const EMAIL_LOGIN_MUTATION = gql`
  mutation EmailLogin($email: String!, $code: String!) {
    emailLogin(email: $email, code: $code) {
      code
      message
      data {
        ...AuthPayloadFields
      }
    }
  }
  ${AUTH_PAYLOAD_FIELDS}
`;

export const EMAIL_REGISTER_MUTATION = gql`
  mutation EmailRegister($email: String!, $code: String!, $password: String!) {
    emailRegister(email: $email, code: $code, password: $password) {
      code
      message
      data
    }
  }
`;

// 兼容 PC 端已有命名，后续页面迁移时可直接复用。
export const LOGIN = LOGIN_MUTATION;
export const REGISTER = REGISTER_MUTATION;
export const ME = ME_QUERY;
export const SEND_EMAIL_CODE = SEND_EMAIL_CODE_MUTATION;
export const EMAIL_LOGIN = EMAIL_LOGIN_MUTATION;
export const EMAIL_REGISTER = EMAIL_REGISTER_MUTATION;
