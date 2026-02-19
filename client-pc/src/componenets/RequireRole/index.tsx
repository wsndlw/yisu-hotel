import { useQuery } from '@apollo/client';
import { Navigate } from 'react-router-dom';
import type { PropsWithChildren } from 'react';
import { ME } from '../../graphql/auth';
import { useUserStore } from '../../store/user';
import { AUTH_TOKEN } from '../../constants/constants';

export type AppRole = 'ADMIN' | 'MERCHANT';

export default function RequireRole(props: PropsWithChildren<{ roles: AppRole[] }>) {
  const token = localStorage.getItem(AUTH_TOKEN) || sessionStorage.getItem(AUTH_TOKEN);

  const { data, loading } = useQuery(ME, { 
    onCompleted: (res) => {
      const role = res?.me?.data?.role as AppRole | undefined;
      if (role && token) {
        useUserStore.getState().setToken(token, role);
      }
    },

    skip: !token,
    fetchPolicy: 'no-cache',
  });

  if (!token) return <Navigate to="/login" replace />;
  if (loading) return null;

  const role = data?.me?.data?.role as AppRole | undefined;
  if (!role) return <Navigate to="/login" replace />;

  if (!props.roles.includes(role)) {
    // 非法访问：按角色跳回首页
    return <Navigate to={role === 'ADMIN' ? '/admin/hotels' : '/merchant/monitor'} replace />;
  }

  return <>{props.children}</>;
}
