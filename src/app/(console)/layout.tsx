import { ConsoleGate } from "@/components/dashboard/console-gate";

export default function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Always pass children through so Instant Navigation can validate nested pages.
  return <ConsoleGate>{children}</ConsoleGate>;
}
