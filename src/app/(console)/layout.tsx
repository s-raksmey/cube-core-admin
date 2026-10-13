import { Suspense, type ReactNode } from "react";
import { connection } from "next/server";
import { ConsoleGate } from "@/components/dashboard/console-gate";

async function ConsoleRoute({ children }: { children: ReactNode }) {
  // The authorization gate is client-side. Mark this layout as request-time
  // rendered so every console page remains in Next's route tree.
  await connection();
  return <ConsoleGate>{children}</ConsoleGate>;
}

export default function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <ConsoleRoute>{children}</ConsoleRoute>
    </Suspense>
  );
}
