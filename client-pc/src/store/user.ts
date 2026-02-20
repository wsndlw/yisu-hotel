/**
 * ========================================
 * 【路由守卫】用户状态管理 Store
 * ========================================
 * 
 * 功能说明：
 * 1. 全局存储登录 Token 和角色信息
 * 2. 自动持久化到 localStorage
 * 3. 路由守卫与 RootRedirect 使用此 Store
 * 
 * @author 易宿酒店预订平台
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AUTH_TOKEN } from '../constants/constants';

export type UserRole = 'ADMIN' | 'MERCHANT' | null;

interface UserState {
  token: string | null;
  role: UserRole;
  setToken: (token: string, role: Exclude<UserRole, null>) => void;
  logout: () => void;
  syncToken: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      token: null,
      role: null,
      setToken: (token, role) => {
        localStorage.setItem(AUTH_TOKEN, token);
        set({ token, role });
      },
      logout: () => {
        localStorage.removeItem(AUTH_TOKEN);
        sessionStorage.removeItem(AUTH_TOKEN);
        set({ token: null, role: null });
      },
      // 兼容历史登录状态（仅存 token 的情况）
      syncToken: () => {
        const token = localStorage.getItem(AUTH_TOKEN) || sessionStorage.getItem(AUTH_TOKEN);
        if (token) {
          set({ token });
        }
      },
    }),
    {
      name: 'easy-stay-auth',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
