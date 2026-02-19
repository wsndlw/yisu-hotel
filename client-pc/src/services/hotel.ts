import { message } from 'antd';
import { useMutation, useQuery } from '@apollo/client';
import { client } from '../utils/apollo';
import {
  APPROVE_HOTEL,
  CREATE_HOTEL,
  DELETE_HOTEL,
  HOTEL,
  HOTELS,
  MY_HOTELS,
  OFFLINE_HOTEL,
  PUBLISH_HOTEL,
  REJECT_HOTEL,
  RESTORE_HOTEL,
  SET_HOTEL_IMAGES,
  SUBMIT_HOTEL,
  UPDATE_HOTEL,
  WITHDRAW_HOTEL,
  REQUEST_OFFLINE,
} from '../graphql/hotel';
import { DEFAULT_PAGE_SIZE } from '../utils/constants';

/**
 * 获取酒店列表（支持分页和筛选）
 */
export const useHotels = (
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  filters?: {
    city?: string;
    status?: string;
    starLevel?: number;
    keyword?: string;
    merchantKeyword?: string;
  },
) => {
  const { data, loading, refetch } = useQuery(HOTELS, {
    variables: {
      input: {
        page,
        pageSize,
        ...filters,
      },
    },
    fetchPolicy: 'no-cache',
  });

  const result = data?.hotels;
  const pageInfo = result?.page;

  const refetchHandler = async (params: {
    page?: number;
    pageSize?: number;
    city?: string;
    status?: string;
    starLevel?: number;
    keyword?: string;
    merchantKeyword?: string;
  }) => {
    const { data: res, errors } = await refetch({
      input: {
        page: params.page || 1,
        pageSize: params.pageSize || DEFAULT_PAGE_SIZE,
        city: params.city,
        status: params.status,
        starLevel: params.starLevel,
        keyword: params.keyword,
        merchantKeyword: params.merchantKeyword,
      },
    });

    if (errors) {
      return {
        success: false,
        data: [],
        total: 0,
      };
    }

    const refetchResult = res?.hotels;
    const refetchPage = refetchResult?.page;

    return {
      success: true,
      data: refetchResult?.data || [],
      total: refetchPage?.total || 0,
      page: refetchPage?.pageNum || 1,
      pageSize: refetchPage?.pageSize || DEFAULT_PAGE_SIZE,
    };
  };

  return {
    loading,
    refetch: refetchHandler,
    list: result?.data || [],
    total: pageInfo?.total || 0,
    page: pageInfo?.pageNum || page,
    pageSize: pageInfo?.pageSize || pageSize,
  };
};

/**
 * 获取当前用户的酒店列表
 */
export const useMyHotels = (status?: string) => {
  const { data, loading, refetch } = useQuery(MY_HOTELS, {
    variables: { status },
    fetchPolicy: 'no-cache',
  });

  const result = data?.myHotels;

  return {
    loading,
    refetch,
    data: result?.data || [],
    list: result?.data || [],
  };
};

/**
 * 获取酒店详情
 */
export const useHotelDetail = (id?: string) => {
  const { data, loading, refetch } = useQuery(HOTEL, {
    variables: { id },
    skip: !id,
    fetchPolicy: 'no-cache',
  });

  const result = data?.hotel;

  return {
    loading,
    refetch,
    data: result?.data,
    hotel: result?.data,
  };
};

export const fetchHotelDetailOnce = async (id: string) => {
  const { data } = await client.query({
    query: HOTEL,
    variables: { id },
    fetchPolicy: 'network-only',
  });
  return data?.hotel?.data;
};

/**
 * 创建酒店
 */
export const useCreateHotel = (): [createHandler: Function, loading: boolean] => {
  const [create, { loading }] = useMutation(CREATE_HOTEL);

  const createHandler = async (
    input: any,
    callback?: (hotel: any) => void,
  ) => {
    try {
      const res = await create({ variables: { input } });
      const result = res.data?.createHotel;
      if (result?.code === 200 && result?.data) {
        message.success(result.message || '酒店创建成功');
        callback?.(result.data);
        return result.data;
      }
      message.error(result?.message || '创建失败');
      return null;
    } catch (error: any) {
      message.error(error.message || '创建失败');
      return null;
    }
  };

  return [createHandler, loading];
};

/**
 * 更新酒店信息
 */
export const useUpdateHotel = (): [updateHandler: Function, loading: boolean] => {
  const [update, { loading }] = useMutation(UPDATE_HOTEL);

  const updateHandler = async (
    id: string,
    input: any,
    callback?: (hotel: any) => void,
  ) => {
    try {
      const res = await update({ variables: { id, input } });
      const result = res.data?.updateHotel;
      if (result?.code === 200 && result?.data) {
        message.success(result.message || '保存成功');
        callback?.(result.data);
        return result.data;
      }
      message.error(result?.message || '保存失败');
      return null;
    } catch (error: any) {
      message.error(error.message || '保存失败');
      return null;
    }
  };

  return [updateHandler, loading];
};

/**
 * 删除酒店
 */
export const useDeleteHotel = (): [deleteHandler: Function, loading: boolean] => {
  const [del, { loading }] = useMutation(DELETE_HOTEL);

  const deleteHandler = async (
    id: string,
    callback?: () => void,
  ) => {
    try {
      const res = await del({ variables: { id } });
      const result = res.data?.deleteHotel;
      if (result?.code === 200) {
        message.success(result.message || '删除成功');
        callback?.();
        return true;
      }
      message.error(result?.message || '删除失败');
      return false;
    } catch (error: any) {
      message.error(error.message || '删除失败');
      return false;
    }
  };

  return [deleteHandler, loading];
};

/**
 * 提交酒店审核
 */
export const useSubmitHotel = (): [submitHandler: Function, loading: boolean] => {
  const [submit, { loading }] = useMutation(SUBMIT_HOTEL);

  const submitHandler = async (
    id: string,
    callback?: (hotel: any) => void,
  ) => {
    try {
      const res = await submit({ variables: { id } });
      const result = res.data?.submitHotelForReview;
      if (result?.code === 200 && result?.data) {
        message.success(result.message || '提交审核成功');
        callback?.(result.data);
        return result.data;
      }
      message.error(result?.message || '提交失败');
      return null;
    } catch (error: any) {
      message.error(error.message || '提交失败');
      return null;
    }
  };

  return [submitHandler, loading];
};

/**
 * 商户撤回审核
 */
export const useWithdrawHotel = (): [withdrawHandler: Function, loading: boolean] => {
  const [withdraw, { loading }] = useMutation(WITHDRAW_HOTEL);

  const withdrawHandler = async (id: string, callback?: (hotel: any) => void) => {
    try {
      const res = await withdraw({ variables: { id } });
      const result = res.data?.withdrawHotel;
      if (result?.code === 200 && result?.data) {
        message.success(result.message || '撤回成功');
        callback?.(result.data);
        return result.data;
      }
      message.error(result?.message || '撤回失败');
      return null;
    } catch (error: any) {
      message.error(error.message || '撤回失败');
      return null;
    }
  };

  return [withdrawHandler, loading];
};

/**
 * 商户申请下线
 */
export const useRequestOffline = (): [requestHandler: Function, loading: boolean] => {
  const [request, { loading }] = useMutation(REQUEST_OFFLINE);

  const requestHandler = async (id: string, callback?: (hotel: any) => void) => {
    try {
      const res = await request({ variables: { id } });
      const result = res.data?.requestOffline;
      if (result?.code === 200 && result?.data) {
        message.success(result.message || '已申请下线');
        callback?.(result.data);
        return result.data;
      }
      message.error(result?.message || '申请失败');
      return null;
    } catch (error: any) {
      message.error(error.message || '申请失败');
      return null;
    }
  };

  return [requestHandler, loading];
};

/**
 * 设置酒店图片
 */
export const useSetHotelImages = (): [setImagesHandler: Function, loading: boolean] => {
  const [setImages, { loading }] = useMutation(SET_HOTEL_IMAGES);

  const setImagesHandler = async (
    hotelId: string,
    urls: string[],
    callback?: (hotel: any) => void,
  ) => {
    try {
      const res = await setImages({ variables: { input: { hotelId, urls } } });
      const result = res.data?.setHotelImages;
      if (result?.code === 200 && result?.data) {
        message.success(result.message || '图片设置成功');
        callback?.(result.data);
        return result.data;
      }
      message.error(result?.message || '设置失败');
      return null;
    } catch (error: any) {
      message.error(error.message || '设置失败');
      return null;
    }
  };

  return [setImagesHandler, loading];
};

/**
 * 审核通过酒店
 */
export const useApproveHotel = (): [approveHandler: Function, loading: boolean] => {
  const [approve, { loading }] = useMutation(APPROVE_HOTEL);

  const approveHandler = async (
    id: string,
    callback?: () => void,
  ) => {
    try {
      const res = await approve({ variables: { id } });
      const result = res.data?.approveHotel;
      if (result?.code === 200) {
        message.success(result.message || '审核通过');
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

  return [approveHandler, loading];
};

/**
 * 审核拒绝酒店
 */
export const useRejectHotel = (): [rejectHandler: Function, loading: boolean] => {
  const [reject, { loading }] = useMutation(REJECT_HOTEL);

  const rejectHandler = async (
    id: string,
    reason: string,
    callback?: () => void,
  ) => {
    try {
      const res = await reject({ variables: { id, reason } });
      const result = res.data?.rejectHotel;
      if (result?.code === 200) {
        message.success(result.message || '已拒绝');
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

  return [rejectHandler, loading];
};

/**
 * 发布酒店
 */
export const usePublishHotel = (): [publishHandler: Function, loading: boolean] => {
  const [publish, { loading }] = useMutation(PUBLISH_HOTEL);

  const publishHandler = async (
    id: string,
    callback?: () => void,
  ) => {
    try {
      const res = await publish({ variables: { id } });
      const result = res.data?.publishHotel;
      if (result?.code === 200) {
        message.success(result.message || '发布成功');
        callback?.();
        return result.data;
      }
      message.error(result?.message || '发布失败');
      return null;
    } catch (error: any) {
      message.error(error.message || '发布失败');
      return null;
    }
  };

  return [publishHandler, loading];
};

/**
 * 下线酒店
 */
export const useOfflineHotel = (): [offlineHandler: Function, loading: boolean] => {
  const [offline, { loading }] = useMutation(OFFLINE_HOTEL);

  const offlineHandler = async (
    id: string,
    callback?: () => void,
  ) => {
    try {
      const res = await offline({ variables: { id } });
      const result = res.data?.offlineHotel;
      if (result?.code === 200) {
        message.success(result.message || '已下线');
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

  return [offlineHandler, loading];
};

/**
 * 恢复酒店
 */
export const useRestoreHotel = (): [restoreHandler: Function, loading: boolean] => {
  const [restore, { loading }] = useMutation(RESTORE_HOTEL);

  const restoreHandler = async (
    id: string,
    callback?: () => void,
  ) => {
    try {
      const res = await restore({ variables: { id } });
      const result = res.data?.restoreHotel;
      if (result?.code === 200) {
        message.success(result.message || '恢复成功');
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

  return [restoreHandler, loading];
};
