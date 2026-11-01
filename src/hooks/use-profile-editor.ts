"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@apollo/client/react";
import { UpdateMyProfileDocument } from "@/lib/apollo/generated/graphql";
import { useConsoleUser } from "@/components/providers/console-user-provider";

export function useProfileEditor() {
  const user = useConsoleUser();
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [update] = useMutation(UpdateMyProfileDocument);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  function start() {
    setFirstName(user.firstName ?? ""); setLastName(user.lastName ?? ""); setUsername(user.username ?? "");
    setFile(null); setPreview(null); setRemoveImage(false); setError(""); setNotice(""); setEditing(true);
  }
  function chooseImage(selected?: File) {
    if (!selected) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(selected.type) || selected.size > 3000 * 1024) {
      setError("Choose a PNG, JPEG, or WebP image smaller than 3000 KB."); return;
    }
    setFile(selected); setPreview(URL.createObjectURL(selected)); setRemoveImage(false); setError("");
  }
  async function save() {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      let image;
      if (file) {
        const contentBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result).split(",")[1]);
          reader.onerror = () => reject(new Error("Unable to read the selected image"));
          reader.readAsDataURL(file);
        });
        image = { fileName: file.name, mimeType: file.type, contentBase64 };
      }
      await update({ variables: { input: { firstName: firstName.trim(), lastName: lastName.trim(), username: username.trim() || null, image, removeImage } } });
      setEditing(false); setFile(null); setPreview(null); setNotice("Profile updated.");
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Unable to update your profile"); }
    finally { setSaving(false); }
  }
  return { editing, firstName, setFirstName, lastName, setLastName, username, setUsername, preview, removeImage, error, notice,
    saving, start, chooseImage, save,
    cancel: () => { setEditing(false); setFile(null); setPreview(null); setError(""); },
    removePhoto: () => { setRemoveImage(true); setFile(null); setPreview(null); },
  };
}
