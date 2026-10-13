import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";

export default function MediaPage() {
  return (
    <div>
      <PageHeader
        title="Media"
        description="Media module is not implemented yet."
      />
      <EmptyState
        title="No media module yet"
        description="Storage usage stays at 0 B until media upload exists."
      />
    </div>
  );
}
