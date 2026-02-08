import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

/**
 * Parses fragment (hash) for OAuth callback params: access_token, optionally refresh_token.
 */
function parseFragmentParams(hash: string): Record<string, string> {
  const params: Record<string, string> = {};
  const stripped = hash.startsWith("#") ? hash.slice(1) : hash;
  for (const part of stripped.split("&")) {
    const [key, value] = part.split("=", 2);
    if (key && value) {
      params[decodeURIComponent(key)] = decodeURIComponent(value);
    }
  }
  return params;
}

const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const hash = window.location.hash;
    const params = parseFragmentParams(hash);
    const accessToken = params.access_token;

    if (!accessToken) {
      setError("Brak tokenu w odpowiedzi. Spróbuj zalogować się ponownie.");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const refreshToken = params.refresh_token || null;
        await loginWithToken(accessToken, refreshToken);
        const pathname = window.location.pathname;
        const search = window.location.search;
        window.history.replaceState(null, "", pathname + search);
        navigate("/dashboard", { replace: true });
      } catch (e) {
        if (!cancelled) {
          setError("Logowanie nie powiodło się. Spróbuj ponownie.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount; loginWithToken identity changes after setUser and would cause a loop
  }, []);

  if (error) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>{error}</p>
        <button type="button" onClick={() => navigate("/login", { replace: true })}>
          Wróć do logowania
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <p>Logowanie…</p>
    </div>
  );
};

export default AuthCallbackPage;
