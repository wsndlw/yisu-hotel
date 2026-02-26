import { useMutation, useQuery } from '@apollo/client';
import { ALL_FACILITIES, DELETE_FACILITY, FACILITIES, HARD_DELETE_FACILITY, SET_FACILITY_ENABLED, UPSERT_FACILITY } from '../graphql/facility';
import { message } from 'antd';

export const useAllFacilities = () => {
  const { data, loading, refetch } = useQuery(ALL_FACILITIES, {
    fetchPolicy: 'no-cache',
  });

  const result = data?.allFacilities;

  return {
    loading,
    refetch,
    data: result?.data || [],
    list: result?.data || [],
  };
};


/**
 * 获取启用的设施列表
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

/**
 * 新增或更新设施
 */
export const useUpsertFacility = (): [upsertHandler: Function, loading: boolean] => {
  const [upsert, { loading }] = useMutation(UPSERT_FACILITY);

  const upsertHandler = async (
    id: string | null,
    name: string,
    type: string,
    category?: string,
    enabled?: boolean,
    callback?: () => void,
    silent?: boolean,
  ) => {
    try {
      const res = await upsert({ variables: { id: id || undefined, name, type, category, enabled } });
      const result = res.data?.upsertFacility;
      if (result?.code === 200) {
        if (!silent) {
          message.success(result.message || (id ? '设施更新成功' : '设施添加成功'));
        }
        callback?.();
        return result.data; // 返回 data 以便后续操作（如获取 id）
      } else {
        message.error(result?.message || '操作失败');
        return null;
      }
    } catch (error: any) {
      message.error(error.message || '操作失败');
      return null;
    }
  };

  return [upsertHandler, loading];
};

/**
 * 启用或禁用设施
 */
export const useSetFacilityEnabled = (): [setHandler: Function, loading: boolean] => {
  const [setEnabled, { loading }] = useMutation(SET_FACILITY_ENABLED);

  const setHandler = async (
    id: string,
    enabled: boolean,
    callback?: () => void,
    silent?: boolean,
  ) => {
    try {
      const res = await setEnabled({ variables: { id, enabled } });
      const result = res.data?.setFacilityEnabled;
      if (result?.code === 200) {
        if (!silent) {
          message.success(result.message || (enabled ? '设施已启用' : '设施已禁用'));
        }
        callback?.();
        return result.data;
      }
      message.error(result?.message || '操作失败');
      return null;
    } catch (error: any) {
      message.error(error.message || '操作失败');
      return null;
    }
  };

  return [setHandler, loading];
};

/**
 * 软删除设施
 */
export const useDeleteFacility = (): [deleteHandler: Function, loading: boolean] => {
  const [del, { loading }] = useMutation(DELETE_FACILITY);

  const deleteHandler = async (
    id: string,
    callback?: () => void,
    silent?: boolean,
  ) => {
    try {
      const res = await del({ variables: { id } });
      const result = res.data?.deleteFacility;
      if (result?.code === 200) {
        if (!silent) {
          message.success(result.message || '设施已删除');
        }
        callback?.();
        return result.data;
      }
      if (!silent) {
        message.error(result?.message || '删除失败');
      }
      return null;
    } catch (error: any) {
      if (!silent) {
        message.error(error.message || '删除失败');
      }
      return null;
    }
  };

  return [deleteHandler, loading];
};

/**
 * 硬删除设施
 */
export const useHardDeleteFacility = (): [deleteHandler: Function, loading: boolean] => {
  const [del, { loading }] = useMutation(HARD_DELETE_FACILITY);

  const deleteHandler = async (
    id: string,
    callback?: () => void,
    silent?: boolean,
  ) => {
    try {
      const res = await del({ variables: { id } });
      const result = res.data?.hardDeleteFacility;
      if (result?.code === 200) {
        if (!silent) {
          message.success(result.message || '设施已永久删除');
        }
        callback?.();
        return true;
      }
      if (!silent) {
        message.error(result?.message || '删除失败');
      }
      return null;
    } catch (error: any) {
      if (!silent) {
        message.error(error.message || '删除失败');
      }
      return null;
    }
  };

  return [deleteHandler, loading];
};
