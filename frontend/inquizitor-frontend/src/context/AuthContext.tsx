import React, { createContext, useContext, useState, useEffect } from "react";
import { loginUser } from "../services/auth";
import type { Token, UserRead } from "../services/auth";

interface AuthContextType {
  user: UserRead | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserRead | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      fetch(`${import.meta.env.VITE_API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then((user: UserRead) => setUser(user))
        .catch(() => {
          localStorage.removeItem("access_token");
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const tokenData: Token = await loginUser(email, password);
    localStorage.setItem("access_token", tokenData.access_token);
    const res = await fetch(`${import.meta.env.VITE_API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const user = await res.json();
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
