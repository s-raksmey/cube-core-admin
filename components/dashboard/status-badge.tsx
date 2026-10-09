import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();
  const variant =
    normalized === "ACTIVE" || normalized === "PUBLISHED"
      ? "default"
      : normalized === "SUSPENDED" || normalized === "DISABLED"
        ? "destructive"
        : "secondary";

  return (
    <Badge variant={variant} className="capitalize">
      {normalized.toLowerCase()}
    </Badge>
  );
}
