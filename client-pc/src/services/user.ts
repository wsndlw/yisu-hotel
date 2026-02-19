import { message } from 'antd';
import { useMutation } from '@apollo/client';
import { UPDATE_ME } from '../graphql/user';

/**
 * 更新当前用户信息
 */
export const useUpdateMe = (): [updateHandler: Function, loading: boolean] => {
  const [update, { loading }] = useMutation(UPDATE_ME);

  const updateHandler = async (
    input: any,
    callback?: (user: any) => void,
  ) => {
    try {
      const res = await update({ variables: { input } });
      const result = res.data?.updateMe;
      if (result?.code === 200 && result?.data) {
        message.success(result.message || '个人信息更新成功');
        callback?.(result.data);
        return result.data;
      }
      message.error(result?.message || '更新失败');
      return null;
    } catch (error: any) {
      message.error(error.message || '更新失败');
      return null;
    }
  };

  return [updateHandler, loading];
};
