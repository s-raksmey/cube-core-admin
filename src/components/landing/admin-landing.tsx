import { ConsoleAuthFlow } from "@/components/auth/console-auth-flow";

type AdminLandingProps = {
  initialShowLogin?: boolean;
};

export function AdminLanding({ initialShowLogin = false }: AdminLandingProps) {
  return <ConsoleAuthFlow initialShowLogin={initialShowLogin} />;
}
