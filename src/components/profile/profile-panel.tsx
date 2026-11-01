"use client";

import { useProfileEditor } from "@/hooks/use-profile-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Pencil, Upload, Loader2 } from "lucide-react";
import { useConsoleUser } from "@/components/providers/console-user-provider";
import { PageHeader } from "@/components/dashboard/page-header";
import { UserAvatar } from "@/components/profile/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Building2, Mail, ShieldCheck, UserRound } from "lucide-react";

export function ProfilePanel() {
  const user = useConsoleUser();
  const editor = useProfileEditor();
  const role = user.role === "SUPERADMIN" ? "Super Admin" : user.role === "ADMIN" ? "Admin" : "Editor";
  return <div className="mx-auto w-full max-w-4xl">
    <PageHeader title="My profile" description="Your personal details and workspace information." actions={!editor.editing ? <Button variant="outline" onClick={editor.start}><Pencil className="size-4" />Edit profile</Button> : undefined} />
    {editor.notice ? <p role="status" className="mb-4 text-sm text-emerald-600">{editor.notice}</p> : null}
    {editor.error ? <p role="alert" className="mb-4 text-sm text-destructive">{editor.error}</p> : null}
    <section className="overflow-hidden rounded-2xl border bg-card shadow-sm" aria-label="Your profile">
      <div className="h-24 border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent sm:h-28" />
      <div className="px-5 pb-6 sm:px-8 sm:pb-8">
        <div className="-mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <UserAvatar user={user} className="size-20 border-4 border-card bg-card shadow-sm [&_[data-slot=avatar-fallback]]:text-2xl" />
            <h2 className="mt-4 break-words text-2xl font-semibold tracking-tight">{user.fullName || "Your profile"}</h2>
            <p className="mt-1 break-all text-sm text-muted-foreground">{user.email}</p>
          </div>
          <Badge variant="secondary" className="gap-1.5 px-2.5 py-1"><ShieldCheck className="size-3.5" />{role}</Badge>
        </div>
        {editor.editing ? <form className="mt-8 space-y-6 border-t pt-6" onSubmit={(event) => { event.preventDefault(); void editor.save(); }}>
          <fieldset disabled={editor.saving} className="space-y-6 disabled:opacity-60">
            <div className="flex flex-wrap items-center gap-4">
              {editor.preview || editor.removeImage ? <Avatar className="size-20"><AvatarImage src={editor.preview ?? undefined} alt="New profile preview" /><AvatarFallback>{(user.fullName || user.email)[0]?.toUpperCase()}</AvatarFallback></Avatar> : <UserAvatar user={user} className="size-20" />}
              <div className="space-y-2"><div className="flex flex-wrap gap-2">
                <label className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm font-medium focus-within:ring-2 focus-within:ring-ring"><Upload className="size-4" />Upload photo<input type="file" className="sr-only" accept="image/png,image/jpeg,image/webp" onChange={(event) => { editor.chooseImage(event.target.files?.[0]); event.target.value = ""; }} /></label>
                {(user.avatarUrl || editor.preview) && !editor.removeImage ? <Button type="button" variant="ghost" onClick={editor.removePhoto}>Remove photo</Button> : null}
              </div><p className="text-xs text-muted-foreground">PNG, JPEG or WebP, up to 3000 KB. Photos are cropped to a square.</p></div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">First name<Input required maxLength={80} autoComplete="given-name" value={editor.firstName} onChange={(event) => editor.setFirstName(event.target.value)} /></label>
              <label className="grid gap-2 text-sm font-medium">Last name<Input required maxLength={80} autoComplete="family-name" value={editor.lastName} onChange={(event) => editor.setLastName(event.target.value)} /></label>
              <label className="grid gap-2 text-sm font-medium">Username<Input minLength={2} maxLength={40} pattern="[a-zA-Z0-9._\-]+" autoComplete="username" value={editor.username} onChange={(event) => editor.setUsername(event.target.value)} /></label>
              <div className="grid gap-2 text-sm font-medium"><span>Email address</span><Input readOnly value={user.email} aria-label="Email address" /><p className="text-xs font-normal text-muted-foreground">Your sign-in email cannot be changed here.</p></div>
            </div>
            <div className="flex justify-end gap-2 border-t pt-5"><Button type="button" variant="outline" onClick={editor.cancel}>Cancel</Button><Button type="submit">{editor.saving ? <Loader2 className="size-4 animate-spin" /> : null}{editor.saving ? "Saving…" : "Save changes"}</Button></div>
          </fieldset>
        </form> : null}
        <div className="mt-8 grid gap-8 border-t pt-6 md:grid-cols-2 md:gap-10">
          <section aria-labelledby="personal-details">
            <h3 id="personal-details" className="flex items-center gap-2 text-sm font-semibold"><UserRound className="size-4 text-muted-foreground" />Personal details</h3>
            <dl className="mt-5 space-y-5 text-sm">
              <div><dt className="text-muted-foreground">Full name</dt><dd className="mt-1 break-words font-medium">{user.fullName || "—"}</dd></div>
              <div><dt className="flex items-center gap-1.5 text-muted-foreground"><Mail className="size-3.5" />Email address</dt><dd className="mt-1 break-all font-medium">{user.email}</dd></div>
            </dl>
          </section>
          <section aria-labelledby="workspace-details">
            <h3 id="workspace-details" className="flex items-center gap-2 text-sm font-semibold"><Building2 className="size-4 text-muted-foreground" />Workspace</h3>
            <dl className="mt-5 space-y-5 text-sm">
              <div><dt className="text-muted-foreground">Workspace name</dt><dd className="mt-1 break-words font-medium">{user.tenant.name}</dd></div>
              <div><dt className="text-muted-foreground">Your role</dt><dd className="mt-1 font-medium">{role}</dd></div>
            </dl>
          </section>
        </div>
      </div>
    </section>
  </div>;
}
