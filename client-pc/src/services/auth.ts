import { message } from 'antd';
import { useMutation, useQuery } from '@apollo/client';
import { EMAIL_LOGIN, EMAIL_REGISTER, LOGIN, ME, REGISTER, SEND_EMAIL_CODE } from '../graphql/auth';

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
 * 用户注册（旧）
 */
// export const useRegister = (): [registerHandler: Function, loading: boolean] => {
//   const [register, { loading }] = useMutation(REGISTER);

//   const registerHandler = async (
//     username: string,
//     password: string,
//     role: 'MERCHANT' | 'ADMIN',
//     callback?: (data: any) => void,
//     email?: string,
//     emailCode?: string,
//   ) => {
//     try {
//       const res = await register({
//         variables: {
//           input: {
//             username,
//             password,
//             role,
//             // 邮箱验证码
//             email,
//             emailCode,
//           },
//         },
//       });
//       const result = res.data?.register;
//       if (result?.code === 200 && result?.data) {
//         message.success(result.message || '注册成功');
//         callback?.(result.data);
//         return result.data;
//       }
//       message.error(result?.message || '注册失败');
//       return null;
//     } catch (error: any) {
//       message.error(error.message || '注册失败');
//       return null;
//     }
//   };

//   return [registerHandler, loading];
// };
/**
 * 获取当前用户信息
 */
export const useMe = (skip = false) => {
  const { data, loading, refetch } = useQuery(ME, {
    fetchPolicy: 'network-only',
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

/**
 * 发送邮箱验证码
 */
export const useSendEmailCode = (): [sendHandler: (email: string) => Promise<boolean>, loading: boolean] => {
  const [send, { loading }] = useMutation(SEND_EMAIL_CODE);

  const sendHandler = async (email: string): Promise<boolean> => {
    try {
      const res = await send({ variables: { email } });
      const result = res.data?.sendEmailCode;
      if (result?.code === 200) {
        message.success(result.message || '验证码已发送');
        return true;
      }
      message.error(result?.message || '发送失败');
      return false;
    } catch (error: any) {
      message.error(error.message || '发送失败');
      return false;
    }
  };

  return [sendHandler, loading];
};

/**
 * 邮箱验证码登录
 */
export const useEmailLogin = (): [loginHandler: (email: string, code: string, callback?: (data: any) => void) => Promise<boolean>, loading: boolean] => {
  const [login, { loading }] = useMutation(EMAIL_LOGIN);

  const loginHandler = async (email: string, code: string, callback?: (data: any) => void): Promise<boolean> => {
    try {
      const res = await login({ variables: { email, code } });
      const result = res.data?.emailLogin;
      if (result?.code === 200 && result?.data) {
        message.success(result.message || '登录成功');
        callback?.(result.data);
        return true;
      }
      message.error(result?.message || '登录失败');
      return false;
    } catch (error: any) {
      message.error(error.message || '登录失败');
      return false;
    }
  };

  return [loginHandler, loading];
};

/**
 * 邮箱验证码注册
 */
export const useEmailRegister = (): [registerHandler: (email: string, code: string, password: string, role: string, callback?: (token: string) => void) => Promise<boolean>, loading: boolean] => {
  const [register, { loading }] = useMutation(EMAIL_REGISTER);

  const registerHandler = async (email: string, code: string, password: string, role: string, callback?: (token: string) => void): Promise<boolean> => {
    try {
      const res = await register({ variables: { email, code, password, role } });
      const result = res.data?.emailRegister;
      if (result?.code === 200 && result?.data) {
        message.success(result.message || '注册成功');
        callback?.(result.data);
        return true;
      }
      message.error(result?.message || '注册失败');
      return false;
    } catch (error: any) {
      message.error(error.message || '注册失败');
      return false;
    }
  };

  return [registerHandler, loading];
};