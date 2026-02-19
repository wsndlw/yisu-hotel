import { useQuery } from '@apollo/client';
import { AUDIT_RECORDS } from '../graphql/audit';

export function useAuditRecords(input: any) {
  const { data, loading, error, refetch } = useQuery(AUDIT_RECORDS, {
    variables: { input },
    fetchPolicy: 'network-only',
  });

  const list = data?.auditRecords?.items || [];
  const total = data?.auditRecords?.total || 0;

  return { list, total, loading, error, refetch };
}
