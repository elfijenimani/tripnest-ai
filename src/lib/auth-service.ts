import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Profile, ServiceResult } from "@/lib/types";

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message);
  }

  return data.session;
}

export async function getCurrentUser(): Promise<User | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return user;
}

export async function signUpUser(input: {
  fullName: string;
  email: string;
  password: string;
}): Promise<ServiceResult<{ needsEmailConfirmation: boolean }>> {
  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!fullName || !email || !password) {
    return {
      ok: false,
      message: "Please fill in all fields.",
    };
  }

  if (password.length < 8) {
    return {
      ok: false,
      message: "Password must be at least 8 characters.",
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: `${window.location.origin}/login`,
    },
  });

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  return {
    ok: true,
    data: {
      needsEmailConfirmation: !data.session,
    },
  };
}

export async function signInUser(input: {
  email: string;
  password: string;
}): Promise<ServiceResult<User>> {
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!email || !password) {
    return {
      ok: false,
      message: "Please write your email and password.",
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  if (!data.user || !data.session) {
    return {
      ok: false,
      message: "No session was created. Please confirm your email first.",
    };
  }

  return {
    ok: true,
    data: data.user,
  };
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}

export async function getUserProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as Profile | null;
}