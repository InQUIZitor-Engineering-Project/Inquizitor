import React, { createContext, useState, useEffect } from "react";
import { loginUser } from "../services/auth";
import type { Token, UserRead } from "../services/auth";
import { useLoader } from "../components/Loader/GlobalLoader";

interface AuthContextType {
  user: UserRead | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithToken: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserRead | null>(null);
  const [loading, setLoading] = useState(true);
  const { startLoading, stopLoading, withLoader } = useLoader(); 

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
        .then((user: UserRead) => setUser(user))
        .catch(() => {
          // Note: Token refresh logic is handled in api.ts interceptor/wrapper
          // If we are here, it means even refresh failed or token is invalid
          // But we don't want to aggressively logout here if interceptor is working
          // However, for initial load, if /me fails, we probably should clear
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

  const login = async (email: string, password: string) => {

    await withLoader(async () => {
      const tokenData: Token = await loginUser(email, password);
      localStorage.setItem("access_token", tokenData.access_token);
      localStorage.setItem("refresh_token", tokenData.refresh_token);
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
  };

  const loginWithToken = async (accessToken: string, refreshToken: string) => {
    await withLoader(async () => {
      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("refresh_token", refreshToken);
      await fetchAndSetUser(accessToken);
    });
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithToken, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export type { AuthContextType };
