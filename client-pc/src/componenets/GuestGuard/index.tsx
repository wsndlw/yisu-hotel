import { Navigate } from 'react-router-dom';
import type { PropsWithChildren } from 'react';
import { useUserStore } from '../../store/user';

export default function GuestGuard({ children }: PropsWithChildren) {
  const token = useUserStore((state) => state.token);

  if (token) {
    // 已经有 Token，直接跳到根路径
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}