"use client";

import type { AuthUser } from "@/lib/types";
import { createContext, useContext, type ReactNode } from "react";

const ConsoleUserContext = createContext<AuthUser | null>(null);

export function ConsoleUserProvider({
  user,
  children,
}: {
  user: AuthUser;
  children: ReactNode;
}) {
  return (
    <ConsoleUserContext.Provider value={user}>
      {children}
    </ConsoleUserContext.Provider>
  );
}

export function useConsoleUser() {
  const user = useContext(ConsoleUserContext);

  if (!user) {
    throw new Error("useConsoleUser must be used inside ConsoleUserProvider");
  }

  return user;
}
