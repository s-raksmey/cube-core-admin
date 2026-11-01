"use client";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { AuthUser } from "@/lib/types";

export function UserAvatar({ user, className }: {
  user: Pick<AuthUser, "fullName" | "email" | "avatarUrl">;
  className?: string;
}) {
  const words = (user.fullName || user.email).trim().split(/\s+/);
  const initials = `${words[0]?.[0] ?? ""}${words.length > 1 ? words.at(-1)?.[0] ?? "" : ""}`.toUpperCase();
  const image = user.avatarUrl?.startsWith("/storage/") ? "/main-assets/" + user.avatarUrl.slice("/storage/".length) : undefined;
  return <Avatar className={className}>
    {image ? <AvatarImage src={image} alt="" /> : null}
    <AvatarFallback className="bg-primary/10 font-semibold text-primary">{initials || "U"}</AvatarFallback>
  </Avatar>;
}
