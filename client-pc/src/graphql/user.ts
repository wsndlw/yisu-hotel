import { gql } from '@apollo/client';

export const UPDATE_ME = gql`
  mutation UpdateMe($input: UpdateMeInput!) {
    updateMe(input: $input) {
      code
      message
      data {
        id
        username
        role
        avatarUrl
        updatedAt
      }
    }
  }
`;
