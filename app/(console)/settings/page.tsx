import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" description="Settings module placeholder for this MVP." />
      <EmptyState
        title="Settings coming next"
        description="Role-aware settings screens will land in a later phase."
      />
    </div>
  );
}
