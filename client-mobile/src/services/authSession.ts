import { client, isUnauthenticatedError } from '../utils/apollo';
import { ME_QUERY } from '../graphql/auth';
import { AuthUser, isAuthUser, useAuthStore } from '../store/authStore';

interface MeQueryData {
  me: {
    code: number;
    message: string;
    data?: AuthUser | null;
  };
}

export type SessionRestoreStatus = 'anonymous' | 'authenticated' | 'offline';

function isAuthenticationFailure(error: unknown) {
  const apolloError = error as {
    graphQLErrors?: Array<{ extensions?: Record<string, unknown> }>;
    networkError?: unknown;
  };
  return isUnauthenticatedError(apolloError.graphQLErrors, apolloError.networkError);
}

export async function restoreAuthSession(): Promise<SessionRestoreStatus> {
  const store = useAuthStore.getState();
  await store.hydrateFromStorage();

  const { token } = useAuthStore.getState();
  if (!token) return 'anonymous';

  try {
    const result = await client.query<MeQueryData>({
      query: ME_QUERY,
      fetchPolicy: 'network-only',
    });
    const user = result.data.me.data;
    if (!isAuthUser(user)) {
      await clearAuthSession();
      return 'anonymous';
    }

    await useAuthStore.getState().setAuth(token, user);
    return 'authenticated';
  } catch (error) {
    if (isAuthenticationFailure(error)) {
      await clearAuthSession();
      return 'anonymous';
    }

    // 断网或服务暂不可用时保留本地登录快照，避免误登出。
    return 'offline';
  }
}

export async function clearAuthSession(): Promise<void> {
  await Promise.allSettled([
    useAuthStore.getState().clearAuth(),
    client.clearStore(),
  ]);
}
