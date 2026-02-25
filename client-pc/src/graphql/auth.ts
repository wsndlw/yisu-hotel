import { gql } from '@apollo/client';

export const LOGIN = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      code
      message
      data {
        accessToken
        user {
          id
          username
          role
        }
      }
    }
  }
`;

export const REGISTER = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      code
      message
      data {
        accessToken
        user {
          id
          username
          role
        }
      }
    }
  }
`;

export const ME = gql`
  query Me {
    me {
      code
      message
      data {
        id
        username
        email
        role
        avatarUrl
        preferredTagIds
        preferredFacilityIds
      }
    }
  }
`;

export const SEND_EMAIL_CODE = gql`
  mutation SendEmailCode($email: String!) {
    sendEmailCode(email: $email) {
      code
      message
    }
  }
`;

export const EMAIL_LOGIN = gql`
  mutation EmailLogin($email: String!, $code: String!) {
    emailLogin(email: $email, code: $code) {
      code
      message
      data
    }
  }
`;

export const EMAIL_REGISTER = gql`
  mutation EmailRegister($email: String!, $code: String!, $password: String!, $role: String!) {
    emailRegister(email: $email, code: $code, password: $password, role: $role) {
      code
      message
      data
    }
  }
`;
