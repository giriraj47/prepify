import { useEffect } from "react";
import { useProfileStore, useAuthStore } from "@/lib/store";

export function useProfile() {
  const {
    profile,
    loading,
    error,
    initialized,
    loadProfile,
    saveProfile,
    updateProfile,
    clearError,
  } = useProfileStore();

  const { user } = useAuthStore();

  useEffect(() => {
    if (user && !profile && !loading && !error && !initialized) {
      loadProfile();
    }
  }, [user, profile, loading, error, initialized, loadProfile]);

  const isProfileLoading = loading || (!!user && !initialized && !error);

  return {
    profile,
    loading: isProfileLoading,
    error,
    isOnboarded: profile?.is_onboarded ?? false,
    loadProfile,
    saveProfile,
    updateProfile,
    clearError,
  };
}
