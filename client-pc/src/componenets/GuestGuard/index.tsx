import { Navigate } from 'react-router-dom';
import type { PropsWithChildren } from 'react';
import { AUTH_TOKEN } from '../../constants/constants';

export default function GuestGuard({ children }: PropsWithChildren) {
  const token = localStorage.getItem(AUTH_TOKEN) || sessionStorage.getItem(AUTH_TOKEN);

  if (token) {
    // 已经有 Token，直接跳到根路径
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}