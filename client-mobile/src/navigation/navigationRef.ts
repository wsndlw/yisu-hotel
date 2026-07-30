import {
  createNavigationContainerRef,
  NavigatorScreenParams,
} from '@react-navigation/native';

export type HomeTabParamList = {
  Home: undefined;
  Orders: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<HomeTabParamList> | undefined;
  HotelList: Record<string, unknown> | undefined;
  Detail: { id: string; checkInDate?: string; checkOutDate?: string };
  Login: { redirectTo?: string; returnToExisting?: boolean } | undefined;
  Register: { redirectTo?: string; returnToExisting?: boolean } | undefined;
  BookingConfirm: undefined;
  OrderDetail: { id: string };
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
  navigationRef.navigate('Login', {
    redirectTo: currentRoute?.name,
    returnToExisting: true,
  });
}
