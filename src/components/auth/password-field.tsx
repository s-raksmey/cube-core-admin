"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

type PasswordFieldProps = {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
};

export function PasswordField({
  id,
  label = "Password",
  value,
  onChange,
  autoComplete = "current-password",
  required = true,
  disabled = false,
  autoFocus = false,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          disabled={disabled}
          autoFocus={autoFocus}
          className="pr-10"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </Button>
      </div>
    </div>
  );
}
