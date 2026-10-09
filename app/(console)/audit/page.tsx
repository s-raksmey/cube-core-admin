import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";

export default function AuditPage() {
  return (
    <div>
      <PageHeader title="Audit Logs" description="Full audit explorer placeholder." />
      <EmptyState
        title="Audit explorer coming next"
        description="Recent activity is already shown on the dashboard."
      />
    </div>
  );
}
