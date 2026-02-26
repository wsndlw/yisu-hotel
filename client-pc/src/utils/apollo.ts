import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = new HttpLink({
  uri: 'http://localhost:3000/graphql',
});

const authLink = setContext((_, { headers }) => {
  // 从 easy-stay-auth 中读取 token
  let token = null;
  try {
    const raw = localStorage.getItem('easy-stay-auth');
    if (raw) {
      const parsed = JSON.parse(raw);
      token = parsed?.state?.token;
    }
  } catch (e) {
    // ignore
  }

  return {
    headers: {
      ...headers,
      Authorization: token ? `Bearer ${token}` : '',
    },
  };
});

export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
