import { AdminLandingPage } from "@/components/landing/admin-landing-page";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Cube Core Admin" };

export default function LoginPage() {
  return <AdminLandingPage showLogin />;
}
