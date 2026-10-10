import { ConsoleGate } from "@/components/dashboard/console-gate";

export default function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ConsoleGate keeps route content hidden until the session is authorized.
  return <ConsoleGate>{children}</ConsoleGate>;
}
