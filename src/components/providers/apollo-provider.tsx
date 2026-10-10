"use client";

import { useState } from "react";
import { ApolloProvider } from "@apollo/client/react";
import { createApolloClient } from "@/lib/apollo-client";

export function AppApolloProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => createApolloClient());
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
