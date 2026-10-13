import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FormEvent } from "react";

type SearchToolbarProps = {
  label: string;
  placeholder: string;
  value: string;
  onValueChange: (value: string) => void;
  onSearch: () => void;
  className?: string;
};

/** Consistent list-search form for Main Tenant management screens. */
export function SearchToolbar({
  label,
  placeholder,
  value,
  onValueChange,
  onSearch,
  className = "sm:max-w-xl",
}: SearchToolbarProps) {
  return (
    <form
      className={`flex w-full gap-2 ${className}`}
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        onSearch();
      }}
    >
      <Input
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
      />
      <Button type="submit" variant="outline">
        Search
      </Button>
    </form>
  );
}
