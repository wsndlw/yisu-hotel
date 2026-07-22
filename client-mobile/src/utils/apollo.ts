import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { requestLoginNavigation } from '../navigation/navigationRef';
import { useAuthStore } from '../store/authStore';

type HeaderMap = Record<string, string>;

let hydrationPromise: Promise<void> | null = null;
let handlingUnauthenticated = false;

async function getStoredToken() {
  const current = useAuthStore.getState();
  if (!current.isHydrated) {
    hydrationPromise ??= current.hydrateFromStorage().finally(() => {
      hydrationPromise = null;
    });
    await hydrationPromise;
  }
  return useAuthStore.getState().token;
}

export function buildAuthHeaders(headers: HeaderMap = {}, token: string | null): HeaderMap {
  const { Authorization: _authorization, authorization: _lowercaseAuthorization, ...rest } = headers;
  return token ? { ...rest, Authorization: `Bearer ${token}` } : rest;
}

export function isUnauthenticatedError(
  graphQLErrors?: readonly { extensions?: Record<string, unknown> }[],
  networkError?: unknown,
) {
  const hasGraphQLAuthError = graphQLErrors?.some(({ extensions }) => {
    const response = extensions?.response as { statusCode?: unknown } | undefined;
    const originalError = extensions?.originalError as { statusCode?: unknown } | undefined;
    return (
      extensions?.code === 'UNAUTHENTICATED' ||
      response?.statusCode === 401 ||
      originalError?.statusCode === 401
    );
  });

  const httpError = networkError as
    | { statusCode?: unknown; response?: { status?: unknown } }
    | undefined;
  return !!hasGraphQLAuthError || httpError?.statusCode === 401 || httpError?.response?.status === 401;
}

async function handleUnauthenticated() {
  if (handlingUnauthenticated) return;
  handlingUnauthenticated = true;
  try {
    await Promise.allSettled([
      useAuthStore.getState().clearAuth(),
      client.clearStore(),
    ]);
  } finally {
    requestLoginNavigation();
    handlingUnauthenticated = false;
  }
}

const httpLink = new HttpLink({
  uri: //'http://192.168.1.3:3000/graphql'
       'http://localhost:3000/graphql'
});

export const authLink = setContext(async (_, { headers }) => {
  const token = await getStoredToken();
  return { headers: buildAuthHeaders(headers as HeaderMap | undefined, token) };
});

export const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (isUnauthenticatedError(graphQLErrors, networkError)) {
    void handleUnauthenticated();
  }
});


export const client = new ApolloClient({
  link: ApolloLink.from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
});
