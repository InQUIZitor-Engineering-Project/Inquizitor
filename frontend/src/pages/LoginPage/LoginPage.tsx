import React, { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import styled, { useTheme } from "styled-components";
import { Turnstile } from "@marsidev/react-turnstile";
import { Stack, Heading, Text, Input, Button, Checkbox } from "../../design-system/primitives";
import AlertBar from "../../design-system/patterns/AlertBar";
import { useAuth } from "../../hooks/useAuth";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import loginIllustration from "../../assets/login.png";
import AuthLayout from "../Auth/components/AuthLayout";
import AuthLogos from "../Auth/components/AuthLogos";

const MobileHide = styled.div`
  @media (max-width: 768px) {
    display: none;
  }
`;

const LoginPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation() as { state?: { verifiedMessage?: string; verifiedError?: string } };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  useDocumentTitle("Zaloguj się | Inquizitor");

  useEffect(() => {
    const verifiedParam = (searchParams.get("verified") || "").toLowerCase();
    const stateMsg = location.state?.verifiedMessage;
    const stateErr = location.state?.verifiedError;

    if (verifiedParam === "success") {
      setInfoMessage(stateMsg || "Konto zostało potwierdzone. Możesz się zalogować.");
      setErrorMessage("");
    } else if (verifiedParam === "error") {
      setInfoMessage(null);
      if (stateErr) setErrorMessage(stateErr);
    }
  }, [location.state, searchParams]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!turnstileToken && import.meta.env.VITE_TURNSTILE_SITE_KEY) {
      setErrorMessage("Proszę poczekać na weryfikację Turnstile.");
      return;
    }

    setLoading(true);
    try {
      await login(email, password, turnstileToken);
      navigate("/dashboard");
    } catch (err: any) {
      setErrorMessage(err?.message || "Nie udało się zalogować.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <AuthLayout
      illustrationSrc={loginIllustration}
      illustrationAlt="Login Illustration"
      left={
        <Stack $gap="lg">
          <MobileHide>
            <AuthLogos />
          </MobileHide>

          <Stack $gap="xs">
            <Heading $level="h2" as="h1">
              Zaloguj się
            </Heading>
            <Text $variant="body2" $tone="muted">
              Nie masz jeszcze konta?{" "}
              <Link to="/register" style={{ color: theme.colors.brand.primary }}>
                Zarejestruj się
              </Link>
            </Text>
          </Stack>

          <form onSubmit={handleSubmit}>
            <Stack $gap="md">
              <Stack $gap="xs" as="label" htmlFor="email">
                <Text as="span" $variant="body3" $tone="muted">
                  Adres email
                </Text>
                <Input
                  id="email"
                  type="email"
                  $fullWidth
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Stack>

              <Stack $gap="xs" as="label" htmlFor="password">
                <Text as="span" $variant="body3" $tone="muted">
                  Hasło
                </Text>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  $fullWidth
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Stack>

              <div style={{ textAlign: "left" }}>
                <Link to="/forgot-password" style={{ color: theme.colors.brand.primary, fontSize: '14px', textDecoration: 'none' }}>
                  Zapomniałeś hasła?
                </Link>
              </div>

              {infoMessage && <AlertBar variant="success">{infoMessage}</AlertBar>}

              {errorMessage && (
                <AlertBar variant={errorMessage.includes("nie zostało jeszcze aktywowane") ? "warning" : "danger"}>
                  {errorMessage}
                </AlertBar>
              )}

              <Stack $gap="sm">
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Checkbox
                    id="showPassword"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                  />
                  <Text as="span" $variant="body3" $tone="muted">
                    Pokaż hasło
                  </Text>
                </label>

                <Button type="submit" $fullWidth $size="lg" disabled={loading}>
                  {loading ? "Loguję…" : "Zaloguj się →"}
                </Button>
              </Stack>
            </Stack>
          </form>
        </Stack>
      }
    />
    <Turnstile
      siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
      onSuccess={(token) => setTurnstileToken(token)}
      options={{ size: 'invisible' }}
    />
    </>
  );
};

export default LoginPage;
