import { message } from 'antd';
import { useMutation } from '@apollo/client';
import { DELETE_ROOM_TYPE, UPSERT_ROOM_TYPE, UPDATE_ROOM_OPS } from '../graphql/roomType';

export const useUpsertRoomType = (): [upsertHandler: Function, loading: boolean] => {
  const [upsert, { loading }] = useMutation(UPSERT_ROOM_TYPE);

  const upsertHandler = async (
    hotelId: string,
    roomTypeId: string | null,
    input: Record<string, any>,
    callback?: () => void,
  ) => {
    try {
      const res = await upsert({ variables: { hotelId, roomTypeId, input } });
      const result = res.data?.upsertRoomType;
      if (result?.code === 200) {
        message.success(result.message || (roomTypeId ? '房型更新成功' : '房型添加成功'));
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

  return [upsertHandler, loading];
};

export const useDeleteRoomType = (): [deleteHandler: Function, loading: boolean] => {
  const [del, { loading }] = useMutation(DELETE_ROOM_TYPE);

  const deleteHandler = async (roomTypeId: string, callback?: () => void) => {
    try {
      const res = await del({ variables: { roomTypeId } });
      const result = res.data?.deleteRoomType;
      if (result?.code === 200) {
        message.success(result.message || '房型删除成功');
        callback?.();
        return true;
      }
      message.error(result?.message || '操作失败');
      return false;
    } catch (error: any) {
      message.error(error.message || '操作失败');
      return false;
    }
  };

  return [deleteHandler, loading];
};

export const useUpdateRoomOps = (): [handler: Function, loading: boolean] => {
  const [mutate, { loading }] = useMutation(UPDATE_ROOM_OPS);

  const handler = async (roomTypeId: string, input: Record<string, any>, callback?: () => void) => {
    try {
      const res = await mutate({ variables: { roomTypeId, input } });
      const result = res.data?.updateRoomOps;
      if (result?.code === 200) {
        message.success(result.message || '运营调整成功');
        callback?.();
        return true;
      }
      message.error(result?.message || '操作失败');
      return false;
    } catch (error: any) {
      message.error(error.message || '操作失败');
      return false;
    }
  };

  return [handler, loading];
};
