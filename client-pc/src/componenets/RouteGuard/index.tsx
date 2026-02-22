/**
 * ========================================
 * 【统一路由守卫】RouteGuard 
 * ========================================
 * 职责：
 * 1. 拦截未登录（踢去 /login）
 * 2. 拦截越权访问（踢回各自的首页）
 * 3. 处理根路径 / 的自动分流
 */
import { Navigate, useLocation } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import type { PropsWithChildren } from 'react';
import { ME } from '../../graphql/auth';
import { AUTH_TOKEN } from '../../constants/constants';
import { useUserStore } from '../../store/user';

export type AppRole = 'ADMIN' | 'MERCHANT';

interface RouteGuardProps {
  roles?: AppRole[];     // 允许访问的角色（如果不传，代表只要登录就能访问）
  isRoot?: boolean;      // 是否是根路径（处理首页分流逻辑）
}

export default function RouteGuard({ roles, isRoot, children }: PropsWithChildren<RouteGuardProps>) {
  const location = useLocation();
  const token = localStorage.getItem(AUTH_TOKEN) || sessionStorage.getItem(AUTH_TOKEN);
  const { role, setToken } = useUserStore();

  // 1. 发起唯一一次用户信息请求
  const { loading } = useQuery(ME, {
    skip: !token || !!role,
    fetchPolicy: 'network-only',
    onCompleted: (res) => {
      const fetchedRole = res?.me?.data?.role;
      if (fetchedRole && token) setToken(token, fetchedRole);
    },
    onError: () => {
      localStorage.removeItem(AUTH_TOKEN);
      sessionStorage.removeItem(AUTH_TOKEN);
      window.location.href = '/login';
    }
  });

  // ========== 开始大闸的判定逻辑 ==========

  // 拦截 1：没 Token，直接踢回登录页
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 拦截 2：有 Token 但还在请求角色信息，显示 Loading
  if (!role && loading) {
    return <div>加载中...</div>; // 或者全局 Loading 组件
  }

  // 防御：如果请求完了还是没角色，踢回登录
  if (!role) return <Navigate to="/login" replace />;

  // 拦截 3：如果是根路径 ("/")，直接根据角色跳转页面
  if (isRoot) {
    return <Navigate to={role === 'ADMIN' ? '/admin/dashboard' : '/merchant/monitor'} replace />;
  }

  // 拦截 4：如果指定了角色权限，且当前用户不在允许名单里，踢回老家
  if (roles && !roles.includes(role as AppRole)) {
    return <Navigate to={role === 'ADMIN' ? '/admin/dashboard' : '/merchant/monitor'} replace />;
  }

  // 通关：渲染真实页面
  return <>{children}</>;
}