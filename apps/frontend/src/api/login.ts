import { supabaseBrowser } from "@/lib/supabase-browser";

export async function loginWithEmail(
  email: string,
  password: string,
): Promise<void> {
  const { error } = await supabaseBrowser.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
}

export async function registerWithEmail(
  email: string,
  password: string,
): Promise<void> {
  const { error } = await supabaseBrowser.auth.signUp({
    email,
    password,
  });

  if (error) throw error;
}

export async function logout(): Promise<void> {
  const { error } = await supabaseBrowser.auth.signOut();

  if (error) throw error;
}
