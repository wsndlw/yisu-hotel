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
        role
        avatarUrl
        preferredTagIds
        preferredFacilityIds
      }
    }
  }
`;
