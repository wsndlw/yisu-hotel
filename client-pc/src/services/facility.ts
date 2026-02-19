import { useQuery } from '@apollo/client';
import { FACILITIES } from '../graphql/facility';

/**
 * 设施类型枚举
 */



/**
 * 获取启用的设施列表（type=FACILITY 的设施）
 */
export const useFacilities = () => {
  const { data, loading, refetch } = useQuery(FACILITIES, {
    fetchPolicy: 'no-cache',
  });

  const result = data?.facilities;

  return {
    loading,
    refetch,
    data: (result?.data || []),
  };
};

/**
 * 获取所有启用的设施（包括标签和设施）
 */
export const useAllEnabledFacilities = () => {
  const { data, loading, refetch } = useQuery(FACILITIES, {
    fetchPolicy: 'no-cache',
  });

  const result = data?.facilities;

  return {
    loading,
    refetch,
    data: result?.data || [],
    list: result?.data || [],
  };
};
