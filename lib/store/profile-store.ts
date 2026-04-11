import { create } from "zustand";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthStore } from "./auth-store";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role_id: string | null;
  experience_years: number;
  experience_level: string;
  is_onboarded: boolean;
  roles?: {
    name: string;
  } | null;
}

interface ProfileState {
  profile: Profile | null;
  loading: boolean;
  error: string | null;

  initialized: boolean;
  loadProfile: () => Promise<void>;
  saveProfile: (profileData: Partial<Profile>) => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  clearError: () => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  loading: false,
  initialized: false,
  error: null,

  loadProfile: async () => {
    try {
      set({ loading: true, error: null });
      const supabase = createSupabaseBrowserClient();
      const { user } = useAuthStore.getState();

      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("users")
        .select("*, roles(name)")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      set({
        profile: data,
        loading: false,
        initialized: true,
        error: null,
      });
    } catch (error: any) {
      set({
        loading: false,
        initialized: true,
        error: error.message || "Failed to load profile",
      });
    }
  },

  saveProfile: async (profileData: Partial<Profile>) => {
    try {
      set({ loading: true, error: null });
      const supabase = createSupabaseBrowserClient();
      const { user } = useAuthStore.getState();

      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("users")
        .upsert({
          id: user.id,
          ...profileData,
        })
        .select("*, roles(name)")
        .single();

      if (error) {
        throw error;
      }

      set({
        profile: data,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || "Failed to save profile",
      });
      throw error;
    }
  },

  updateProfile: async (updates: Partial<Profile>) => {
    try {
      set({ loading: true, error: null });
      const supabase = createSupabaseBrowserClient();
      const { user } = useAuthStore.getState();

      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", user.id)
        .select("*, roles(name)")
        .single();

      if (error) {
        throw error;
      }

      set({
        profile: data,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || "Failed to update profile",
      });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
