import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";

export default function ContentPage() {
  return (
    <div>
      <PageHeader
        title="Content"
        description="Content module is not implemented yet."
      />
      <EmptyState
        title="No content module yet"
        description="KPI and charts show zero until content is built."
      />
    </div>
  );
}
