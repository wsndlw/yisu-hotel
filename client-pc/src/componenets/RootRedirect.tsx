/**
 * ========================================
 * 【路由守卫】根路径分流组件
 * ========================================
 * 
 * 功能说明：
 * 1. 访问 / 时根据角色自动跳转
 * 2. 未登录则跳转登录页
 * 3. 解决进入空白 Layout 的问题
 */

import { Navigate } from 'react-router-dom';
import { useUserStore } from '../store/user';
import { AUTH_TOKEN } from '../utils/constants';
import { useMe } from '../services/auth';

export default function RootRedirect() {
  const { token, role, syncToken, setToken } = useUserStore();
  const localToken = localStorage.getItem(AUTH_TOKEN) || sessionStorage.getItem(AUTH_TOKEN);

  // 同步本地 token（刷新后恢复）
  if (!token && localToken) {
    syncToken();
  }

  const { data, loading } = useMe(!localToken);
  const remoteRole = data?.role as 'ADMIN' | 'MERCHANT' | undefined;

  if (!localToken) { 
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return null;
  }

  const finalRole = role || remoteRole;
  if (finalRole && localToken && !role) {
    setToken(localToken, finalRole);
  }

  if (finalRole === 'ADMIN') {
    return <Navigate to="/admin/hotels" replace />;
  }

  if (finalRole === 'MERCHANT') {
    return <Navigate to="/merchant/monitor" replace />;
  }

  return <Navigate to="/login" replace />;
}
