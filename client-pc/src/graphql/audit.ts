import { gql } from '@apollo/client';

export const AUDIT_RECORDS = gql`
  query AuditRecords($input: AuditRecordQueryInput!) {
    auditRecords(input: $input) {
      total
      items {
        id
        hotelId
        hotelName
        action
        reason
        operatorId
        operatorName
        createdAt
      }
    }
  }
`;
