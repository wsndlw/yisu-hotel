import { gql } from '@apollo/client';

export const UPDATE_ME = gql`
  mutation UpdateMe($input: UpdateMeInput!) {
    updateMe(input: $input) {
      code
      message
      data {
        id
        email
        username
        role
        avatarUrl
        updatedAt
      }
    }
  }
`;
