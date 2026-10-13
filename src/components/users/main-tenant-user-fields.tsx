import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type MainTenantUserFieldsProps = {
  idPrefix: "create" | "edit";
  firstName: string;
  lastName: string;
  email: string;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  autoFocus?: boolean;
};

/** Shared identity inputs for Main Tenant SuperAdmin create and edit dialogs. */
export function MainTenantUserFields({
  idPrefix,
  firstName,
  lastName,
  email,
  onFirstNameChange,
  onLastNameChange,
  onEmailChange,
  autoFocus = false,
}: MainTenantUserFieldsProps) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-first-name`}>First name</Label>
          <Input
            id={`${idPrefix}-first-name`}
            value={firstName}
            onChange={(event) => onFirstNameChange(event.target.value)}
            autoFocus={autoFocus}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-last-name`}>Last name</Label>
          <Input
            id={`${idPrefix}-last-name`}
            value={lastName}
            onChange={(event) => onLastNameChange(event.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-email`}>Email</Label>
        <Input
          id={`${idPrefix}-email`}
          type="email"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
        />
      </div>
    </>
  );
}
