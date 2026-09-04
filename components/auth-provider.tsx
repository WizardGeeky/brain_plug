"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export interface UserContextType {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  role: string;
  tenantId?: string | null;
  permissions: string[];
}

interface AuthContextValue {
  user: UserContextType | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  refreshUser: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserContextType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/v1/me");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setUser({
            id: json.data.id,
            fullName: json.data.fullName,
            email: json.data.email,
            avatarUrl: json.data.avatarUrl,
            role: json.data.currentRole || "CLIENT_USER",
            tenantId: json.data.currentTenantId,
            permissions: json.data.permissions || [],
          });
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [pathname]);

  const logout = async () => {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/login");
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        refreshUser: fetchUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
