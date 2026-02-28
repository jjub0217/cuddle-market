import { ApolloClient, InMemoryCache } from '@apollo/client-integration-nextjs'
import { HttpLink } from '@apollo/client'

export function makeClient() {
  const httpLink = new HttpLink({
    uri: '/api/graphql',
  })

  return new ApolloClient({
    cache: new InMemoryCache(),
    link: httpLink,
  })
}
