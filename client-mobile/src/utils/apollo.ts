import { HttpLink } from '@apollo/client';
import { ApolloClient, InMemoryCache } from '@apollo/client';

const httpLink = new HttpLink({
  uri: 'http://192.168.1.3:3000/graphql'
       //'http://localhost:3000/graphql'
})


export const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});
