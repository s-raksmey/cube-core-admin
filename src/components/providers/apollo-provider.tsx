"use client";

import { createApolloClient } from "@/lib/apollo-client";
import { ApolloProvider } from "@apollo/client/react";
import { useState } from "react";

export function AppApolloProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => createApolloClient());

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
