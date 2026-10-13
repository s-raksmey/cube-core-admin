import { AdminLanding } from "@/components/landing/admin-landing";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Cube Core Admin" };

export default function LoginPage() {
  return <AdminLanding initialShowLogin />;
}
