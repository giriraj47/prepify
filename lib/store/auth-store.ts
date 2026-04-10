import { create } from "zustand";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface AuthState {
  user: any | null;
  session: any | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;

  // Actions
  checkAuth: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: true,
  initialized: false,
  error: null,

  checkAuth: async () => {
    try {
      set({ loading: true, error: null });
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        throw error;
      }

      set({
        session,
        user: session?.user || null,
        loading: false,
        initialized: true,
        error: null,
      });
    } catch (error: any) {
      set({
        user: null,
        session: null,
        loading: false,
        initialized: true,
        error: error.message || "Failed to check authentication",
      });
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      set({ loading: true, error: null });
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      set({
        user: data.user,
        session: data.session,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || "Failed to sign in",
      });
      throw error;
    }
  },

  signOut: async () => {
    try {
      set({ loading: true, error: null });
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();

      // Clear profile store too so stale data doesn't linger
      const { useProfileStore } = await import("./profile-store");
      useProfileStore.setState({ profile: null, loading: false, error: null });

      set({
        user: null,
        session: null,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || "Failed to sign out",
      });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
