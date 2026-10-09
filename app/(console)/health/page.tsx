import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";

export default function HealthPage() {
  return (
    <div>
      <PageHeader title="System Health" description="Platform health details placeholder." />
      <EmptyState
        title="Health details coming next"
        description="Dashboard currently reports operational status from the API."
      />
    </div>
  );
}
