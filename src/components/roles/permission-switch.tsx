type PermissionSwitchProps = {
  checked: boolean;
  disabled: boolean;
  label: string;
  role: string;
  onClick: () => void;
};

/** Accessible, compact permission toggle shared by permission matrices. */
export function PermissionSwitch({ checked, disabled, label, role, onClick }: PermissionSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={`${checked ? "Disable" : "Enable"} ${label} for ${role}`}
      disabled={disabled}
      onClick={onClick}
      className={[
        "relative h-5 w-9 shrink-0 rounded-full transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-primary" : "bg-muted-foreground/25",
      ].join(" ")}
    >
      <span className={[
        "absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow-xs",
        "transition-transform duration-150 ease-out",
        checked ? "translate-x-4" : "translate-x-0",
      ].join(" ")} />
    </button>
  );
}
