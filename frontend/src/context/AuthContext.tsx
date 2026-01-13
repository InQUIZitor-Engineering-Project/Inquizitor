import React, { createContext, useState, useEffect } from "react";
import posthog from "posthog-js";
import { loginUser } from "../services/auth";
import type { Token, UserRead } from "../services/auth";
import { apiRequest } from "../services/api";
import { useLoader } from "../components/Loader/GlobalLoader";

interface AuthContextType {
  user: UserRead | null;
  login: (email: string, password: string, turnstileToken?: string | null) => Promise<void>;
  loginWithToken: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => void;
  loading: boolean;

  unreadNotificationsCount: number;
  refreshNotificationsCount: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserRead | null>(null);
  const [loading, setLoading] = useState(true);
  const { startLoading, stopLoading, withLoader } = useLoader(); 
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  const fetchUnreadCount = async (token: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/notifications/me/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadNotificationsCount(data.count);
      }
    } catch (e) {
      console.error("Failed to fetch notifications count", e);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      startLoading();
      
      fetchAndSetUser()
        .catch(() => {
          // Jeśli token jest nieaktywny lub wygasł, czyścimy localStorage
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
          stopLoading();
        });
    } else {
      setLoading(false);
    }
  }, [startLoading, stopLoading]);

  const login = async (email: string, password: string, turnstileToken?: string | null) => {

    await withLoader(async () => {
      const tokenData: Token = await loginUser(email, password, turnstileToken);
      localStorage.setItem("access_token", tokenData.access_token);
      localStorage.setItem("refresh_token", tokenData.refresh_token);
      await fetchAndSetUser();
    });
  };

  const fetchAndSetUser = async () => {
    const res = await apiRequest("/users/me");
    if (!res.ok) throw new Error("Failed to fetch user");
    const user = await res.json();
    setUser(user);
    
    // Identify user in PostHog
    posthog.identify(user.id.toString(), {
      email: user.email,
      name: `${user.firstName} ${user.lastName}`
    });
    
    const token = localStorage.getItem("access_token");
    if (token) await fetchUnreadCount(token);
  };

  const loginWithToken = async (accessToken: string, refreshToken: string) => {
    await withLoader(async () => {
      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("refresh_token", refreshToken);
      await fetchAndSetUser();
    });
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
    posthog.reset();
  };

  const refreshNotificationsCount = () => {
    const token = localStorage.getItem("access_token");
    if (token) fetchUnreadCount(token);
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithToken, logout, loading, unreadNotificationsCount, refreshNotificationsCount }}>
      {children}
    </AuthContext.Provider>
  );
};

export type { AuthContextType };
