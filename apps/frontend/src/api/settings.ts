import { supabaseBrowser } from "@/lib/supabase-browser";
import type {
  UserProfile,
  UserSettings,
  UpdateProfilePayload,
  UpdateSettingsPayload,
} from "@/types/settings";
import { DEFAULT_SETTINGS } from "@/types/settings";

/* ────────────────────────────────────────
   Profile
   ──────────────────────────────────────── */

export async function getProfile(): Promise<UserProfile> {
  const {
    data: { user },
  } = await supabaseBrowser.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabaseBrowser
    .from("profiles")
    .select("id, display_name, nickname, bio, avatar_url, created_at")
    .eq("id", user.id)
    .single();

  if (error) throw error;
  return data;
}

export async function updateProfile(
  payload: UpdateProfilePayload,
): Promise<UserProfile> {
  const {
    data: { user },
  } = await supabaseBrowser.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabaseBrowser
    .from("profiles")
    .update(payload)
    .eq("id", user.id)
    .select("id, display_name, nickname, bio, avatar_url, created_at")
    .single();

  if (error) throw error;
  return data;
}

export async function checkNicknameAvailable(
  nickname: string,
): Promise<boolean> {
  const {
    data: { user },
  } = await supabaseBrowser.auth.getUser();

  const { data, error } = await supabaseBrowser
    .from("profiles")
    .select("id")
    .eq("nickname", nickname)
    .neq("id", user?.id ?? "")
    .maybeSingle();

  if (error) throw error;
  return data === null;
}

/* ────────────────────────────────────────
   Avatar
   ──────────────────────────────────────── */

export async function uploadAvatar(file: File): Promise<string> {
  const {
    data: { user },
  } = await supabaseBrowser.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const ext = file.name.split(".").pop() ?? "png";
  const path = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabaseBrowser.storage
    .from("avatars")
    .upload(path, file, { upsert: true });

  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabaseBrowser.storage.from("avatars").getPublicUrl(path);

  // Update profile with the new avatar URL
  await updateProfile({ avatar_url: `${publicUrl}?t=${Date.now()}` });

  return publicUrl;
}

/* ────────────────────────────────────────
   Settings (preferences)
   ──────────────────────────────────────── */

export async function getSettings(): Promise<UserSettings> {
  const {
    data: { user },
  } = await supabaseBrowser.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabaseBrowser
    .from("user_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;

  // Return defaults if no settings row exists yet
  if (!data) {
    return { user_id: user.id, ...DEFAULT_SETTINGS };
  }

  return data;
}

export async function updateSettings(
  payload: UpdateSettingsPayload,
): Promise<UserSettings> {
  const {
    data: { user },
  } = await supabaseBrowser.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabaseBrowser
    .from("user_settings")
    .upsert(
      { user_id: user.id, ...payload, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    )
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

/* ────────────────────────────────────────
   Account
   ──────────────────────────────────────── */

export async function changePassword(newPassword: string): Promise<void> {
  const { error } = await supabaseBrowser.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
}

export async function getAuthProvider(): Promise<string> {
  const {
    data: { user },
  } = await supabaseBrowser.auth.getUser();

  if (!user) return "email";

  return user.app_metadata?.provider ?? "email";
}

export async function deleteAccount(): Promise<void> {
  const { error } = await supabaseBrowser.rpc("delete_user_account");

  if (error) throw error;

  await supabaseBrowser.auth.signOut();
}
