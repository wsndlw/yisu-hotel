/**
 * ========================================
 * 【路由守卫】AuthGuard 组件
 * ========================================
 * 
 * 功能说明：
 * 1. 拦截所有需要登录才能访问的页面
 * 2. 如果没有 Token，直接跳转登录页
 * 3. 保留当前路径，登录后可跳回
 */

import { Navigate, useLocation } from 'react-router-dom';
import {  useEffect, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { useUserStore } from '../store/user';

export default function AuthGuard({ children }: PropsWithChildren) {
  const location = useLocation();
  const { token, syncToken } = useUserStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // 兼容刷新后的登录态恢复
    syncToken();
    setChecking(false);
  }, [syncToken]);

  if (checking) {
    return null;
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
