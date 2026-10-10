import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();
  const variant =
    normalized === "ACTIVE" || normalized === "PUBLISHED"
      ? "default"
      : normalized === "SUSPENDED" ||
          normalized === "INACTIVE" ||
          normalized === "LOCKED"
        ? "destructive"
        : "secondary";

  return (
    <Badge variant={variant} className="capitalize">
      {normalized.toLowerCase()}
    </Badge>
  );
}
