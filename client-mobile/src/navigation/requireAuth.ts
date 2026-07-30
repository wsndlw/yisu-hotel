import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from './navigationRef';
import { useAuthStore } from '../store/authStore';

export type ProtectedDestination =
  | 'BookingConfirm'
  | 'Orders'
  | 'Profile'
  | 'OrderDetail';

interface RequireAuthOptions {
  returnToExisting?: boolean;
}

/**
 * 统一的移动端鉴权入口。
 *
 * 返回 true 表示已有登录态，可继续执行受保护操作；
 * 返回 false 时已发起登录导航，调用方应停止当前操作。
 */
export function requireAuth(
  navigation: Pick<NavigationProp<RootStackParamList>, 'navigate'>,
  redirectTo: ProtectedDestination,
  options: RequireAuthOptions = {},
): boolean {
  if (useAuthStore.getState().token) return true;

  navigation.navigate('Login', {
    redirectTo,
    returnToExisting: options.returnToExisting,
  });
  return false;
}
