import { message } from 'antd';
import { useMutation, useQuery } from '@apollo/client';
import { ALL_BANNERS, DELETE_BANNER, SET_BANNER_ENABLED, UPSERT_BANNER } from '../graphql/banner';

export const useAllBanners = () => {
  const { data, loading, refetch } = useQuery(ALL_BANNERS, {
    fetchPolicy: 'no-cache',
  });

  return {
    loading,
    refetch,
    data: data?.allBannersQuery || [],
  };
};

export const useUpsertBanner = (): [handler: Function, loading: boolean] => {
  const [mutate, { loading }] = useMutation(UPSERT_BANNER);

  const handler = async (id: string | null, input: any, callback?: () => void) => {
    try {
      const res = await mutate({ variables: { id: id || undefined, input } });
      const result = res.data?.upsertBanner;
      if (result?.id) {
        message.success(id ? '轮播图更新成功' : '轮播图创建成功');
        callback?.();
        return result;
      }
      message.error('保存失败');
      return null;
    } catch (error: any) {
      message.error(error.message || '保存失败');
      return null;
    }
  };

  return [handler, loading];
};

export const useSetBannerEnabled = (): [handler: Function, loading: boolean] => {
  const [mutate, { loading }] = useMutation(SET_BANNER_ENABLED);

  const handler = async (id: string, enabled: boolean, callback?: () => void) => {
    try {
      const res = await mutate({ variables: { id, enabled } });
      const result = res.data?.setBannerEnabled;
      if (result?.id) {
        message.success(enabled ? '已启用' : '已禁用');
        callback?.();
        return result;
      }
      message.error('操作失败');
      return null;
    } catch (error: any) {
      message.error(error.message || '操作失败');
      return null;
    }
  };

  return [handler, loading];
};

export const useDeleteBanner = (): [handler: Function, loading: boolean] => {
  const [mutate, { loading }] = useMutation(DELETE_BANNER);

  const handler = async (id: string, callback?: () => void) => {
    try {
      const res = await mutate({ variables: { id } });
      const ok = res.data?.deleteBanner;
      if (ok) {
        message.success('删除成功');
        callback?.();
        return true;
      }
      message.error('删除失败');
      return false;
    } catch (error: any) {
      message.error(error.message || '删除失败');
      return false;
    }
  };

  return [handler, loading];
};
