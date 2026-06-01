import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { getUserProfile } from "@/lib/auth-service";
import type { AppStatus, Profile } from "@/lib/types";

export function useAuth() {
  const [status, setStatus] = useState<AppStatus>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState("");

  const loadUser = useCallback(async () => {
    try {
      setStatus("loading");
      setError("");

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw new Error(sessionError.message);
      }

      if (!session?.user) {
        setUser(null);
        setProfile(null);
        setStatus("success");
        return;
      }

      setUser(session.user);

      const loadedProfile = await getUserProfile(session.user.id);
      setProfile(loadedProfile);

      setStatus("success");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not load user.";
      setError(message);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadUser]);

  return {
    status,
    user,
    profile,
    error,
    reload: loadUser,
    isAuthenticated: Boolean(user),
  };
}