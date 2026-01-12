import React, { createContext, useState, useEffect } from "react";
import { loginUser } from "../services/auth";
import type { Token, UserRead } from "../services/auth";
import { useLoader } from "../components/Loader/GlobalLoader";

interface AuthContextType {
  user: UserRead | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
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
      
      fetch(`${import.meta.env.VITE_API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then((user: UserRead) => {
          setUser(user)
          fetchUnreadCount(token);
        })
        .catch(() => {
          localStorage.removeItem("access_token");
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

  const login = async (email: string, password: string) => {

    await withLoader(async () => {
      const tokenData: Token = await loginUser(email, password);
      localStorage.setItem("access_token", tokenData.access_token);
      await fetchAndSetUser(tokenData.access_token);
    });
  };

  const fetchAndSetUser = async (token: string) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch user");
    const user = await res.json();
    setUser(user);
    await fetchUnreadCount(token);
  };

  const loginWithToken = async (token: string) => {
    await withLoader(async () => {
      localStorage.setItem("access_token", token);
      await fetchAndSetUser(token);
    });
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    setUser(null);
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