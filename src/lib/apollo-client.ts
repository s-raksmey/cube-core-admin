"use client";

import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
} from "@apollo/client";
import { SetContextLink } from "@apollo/client/link/context";
import { ensureAdminSession } from "@/lib/auth/session-actions";

export function createApolloClient() {
  const authLink = new SetContextLink(async () => {
    await ensureAdminSession();
    return {};
  });

  const httpLink = new HttpLink({
    uri: "/graphql",
    credentials: "same-origin",
  });

  return new ApolloClient({
    link: ApolloLink.from([authLink, httpLink]),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: { fetchPolicy: "cache-and-network" },
    },
  });
}
