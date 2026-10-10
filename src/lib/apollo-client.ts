"use client";

import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
} from "@apollo/client";

export function createApolloClient() {
  const httpLink = new HttpLink({
    uri: "/graphql",
    credentials: "same-origin",
  });

  return new ApolloClient({
    link: ApolloLink.from([httpLink]),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: { fetchPolicy: "cache-and-network" },
    },
  });
}
