import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { connection } from "next/server";
import { Suspense } from "react";

export default function HealthPage() {
  return (
    <Suspense fallback={null}>
      <HealthPageContent />
    </Suspense>
  );
}

async function HealthPageContent() {
  // The console gate authorizes the client shell. This request-time marker
  // keeps the route in the rendered tree for instant-navigation validation.
  await connection();

  return (
    <div>
      <PageHeader
        title="System Health"
        description="Platform health details placeholder."
      />
      <EmptyState
        title="Health details coming next"
        description="Dashboard currently reports operational status from GraphQL."
      />
    </div>
  );
}
