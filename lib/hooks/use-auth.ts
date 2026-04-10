import { useAuthStore } from "@/lib/store";

export function useAuth() {
  const {
    user,
    session,
    loading,
    initialized,
    error,
    checkAuth,
    signIn,
    signOut,
    clearError,
  } = useAuthStore();

  return {
    user,
    session,
    loading,
    initialized,
    error,
    isAuthenticated: !!user,
    isLoading: loading || !initialized,
    checkAuth,
    signIn,
    signOut,
    clearError,
  };
}
