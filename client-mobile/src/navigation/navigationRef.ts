import { createNavigationContainerRef } from '@react-navigation/native';

export type RootStackParamList = {
  Search: undefined;
  HotelList: Record<string, unknown> | undefined;
  Detail: { id: string; checkInDate?: string; checkOutDate?: string };
  Login: { redirectTo?: string } | undefined;
  Register: undefined;
};

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

let loginNavigationPending = false;

export function requestLoginNavigation() {
  loginNavigationPending = true;
  flushPendingLoginNavigation();
}

export function flushPendingLoginNavigation() {
  if (!loginNavigationPending || !navigationRef.isReady()) return;

  const rootState = navigationRef.getRootState();
  if (!rootState.routeNames.includes('Login')) return;

  const currentRoute = navigationRef.getCurrentRoute();
  if (currentRoute?.name === 'Login') {
    loginNavigationPending = false;
    return;
  }

  loginNavigationPending = false;
  navigationRef.navigate('Login', { redirectTo: currentRoute?.name });
}
