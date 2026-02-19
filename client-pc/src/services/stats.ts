import { useQuery } from '@apollo/client';
import { ADMIN_DASHBOARD_STATS } from '../graphql/stats';

/**
 * 获取管理员仪表盘统计数据
 */
export const useAdminDashboardStats = (topN = 10) => {
  const { data, loading, refetch } = useQuery(ADMIN_DASHBOARD_STATS, {
    variables: { topN },
    fetchPolicy: 'no-cache',
  });

  return {
    loading,
    refetch,
    data: data?.adminDashboardStats,
    stats: data?.adminDashboardStats,
  };
};
