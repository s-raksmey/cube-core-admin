import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type Activity = {
  id: string;
  action: string;
  createdAt: string;
  actorEmail?: string | null;
  targetTenantName?: string | null;
};

export function ActivityFeed({
  title,
  items,
  loading,
}: {
  title: string;
  items: Activity[];
  loading?: boolean;
}) {
  return (
    <Card className="border-border shadow-none">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No recent activity yet.
          </p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-border bg-card px-3 py-2"
            >
              <p className="text-sm font-medium text-foreground">
                {item.action}
              </p>
              <p className="text-xs text-muted-foreground">
                {[item.actorEmail, item.targetTenantName]
                  .filter(Boolean)
                  .join(" · ")}
                {" · "}
                {new Date(item.createdAt).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
