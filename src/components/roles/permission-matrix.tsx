import { PermissionSwitch } from "@/components/roles/permission-switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type PermissionMatrixProps = {
  title: string;
  description: string;
  columns: readonly { key: string; label: string }[];
  rows: readonly { key: string; label: string }[];
  saving: boolean;
  isEnabled: (role: string, permission: string) => boolean;
  onToggle: (role: string, permission: string, label: string, enabled: boolean) => void;
};

/** Standard permission-table layout used by Main Tenant role sections. */
export function PermissionMatrix({ title, description, columns, rows, saving, isEnabled, onToggle }: PermissionMatrixProps) {
  const gridTemplateColumns = `minmax(220px,1fr) ${columns.map(() => "120px").join(" ")}`;
  return <Card className="max-w-5xl overflow-hidden py-0">
    <CardHeader className="gap-1 border-b px-5 py-4"><CardTitle className="text-base">{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader>
    <CardContent className="p-0">
      <div className="grid items-center border-b bg-muted/25 px-6 py-3" style={{ gridTemplateColumns }}><span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Permission</span>{columns.map((column) => <div key={column.key} className="text-center text-sm font-medium">{column.label}</div>)}</div>
      {rows.map((row) => <div key={row.key} className="grid min-h-13 items-center border-b px-6 transition-colors last:border-b-0 hover:bg-muted/20" style={{ gridTemplateColumns }}><span className="pr-4 text-sm font-medium">{row.label}</span>{columns.map((column) => { const enabled = isEnabled(column.key, row.key); return <div key={column.key} className="flex items-center justify-center"><PermissionSwitch checked={enabled} disabled={saving} label={row.label} role={column.label} onClick={() => onToggle(column.key, row.key, row.label, enabled)} /></div>; })}</div>)}
    </CardContent>
  </Card>;
}
