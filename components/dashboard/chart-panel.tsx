import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type ChartPoint = { label: string; value: number };

export function ChartPanel({
  title,
  points,
  loading,
  emptyLabel = "No data yet",
}: {
  title: string;
  points: ChartPoint[];
  loading?: boolean;
  emptyLabel?: string;
}) {
  const max = Math.max(...points.map((p) => p.value), 1);

  return (
    <Card className="border-border shadow-none">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : points.every((p) => p.value === 0) ? (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          <div className="flex h-40 items-end gap-2">
            {points.map((point) => (
              <div
                key={point.label}
                className="flex min-w-0 flex-1 flex-col items-center gap-2"
              >
                <div
                  className="w-full rounded-t-md bg-primary/90"
                  style={{ height: `${(point.value / max) * 100}%` }}
                  title={`${point.label}: ${point.value}`}
                />
                <span className="truncate text-[10px] text-muted-foreground">
                  {point.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
