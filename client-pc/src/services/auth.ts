import { message } from 'antd';
import { useMutation, useQuery } from '@apollo/client';
import { LOGIN, ME, REGISTER } from '../graphql/auth';

/**
 * 用户登录
 */
export const useLogin = (): [loginHandler: Function, loading: boolean] => {
  const [login, { loading }] = useMutation(LOGIN);

  const loginHandler = async (
    username: string,
    password: string,
    callback?: (data: any) => void,
  ) => {
    try {
      const res = await login({ variables: { input: { username, password } } });
      const result = res.data?.login;
      if (result?.code === 200 && result?.data) {
        message.success(result.message || '登录成功');
        callback?.(result.data);
        return result.data;
      }
      message.error(result?.message || '登录失败');
      return null;
    } catch (error: any) {
      message.error(error.message || '登录失败');
      return null;
    }
  };

  return [loginHandler, loading];
};

/**
 * 用户注册
 */
export const useRegister = (): [registerHandler: Function, loading: boolean] => {
  const [register, { loading }] = useMutation(REGISTER);

  const registerHandler = async (
    username: string,
    password: string,
    role: 'MERCHANT' | 'ADMIN',
    callback?: (data: any) => void,
  ) => {
    try {
      const res = await register({ variables: { input: { username, password, role } } });
      const result = res.data?.register;
      if (result?.code === 200 && result?.data) {
        message.success(result.message || '注册成功');
        callback?.(result.data);
        return result.data;
      }
      message.error(result?.message || '注册失败');
      return null;
    } catch (error: any) {
      message.error(error.message || '注册失败');
      return null;
    }
  };

  return [registerHandler, loading];
};

/**
 * 获取当前用户信息
 */
export const useMe = (skip = false) => {
  const { data, loading, refetch } = useQuery(ME, {
    fetchPolicy: 'no-cache',
    skip,
  });

  const result = data?.me;
  
  return {
    loading,
    refetch,
    data: result?.data,
    user: result?.data,
  };
};
