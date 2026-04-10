"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/store";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    // Initialize auth state on app load
    checkAuth();
  }, [checkAuth]);

  return <>{children}</>;
}
