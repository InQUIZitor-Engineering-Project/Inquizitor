"use client";
import React, { Suspense, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import styled, { useTheme } from "styled-components";
import {
  Stack,
  Heading,
  Text,
  Input,
  Button,
  Checkbox,
  AlertBar,
} from "@inquizitor/ui";
import { loginUser } from "@/services/auth";
import AuthLayout from "@/components/Auth/AuthLayout";
import AuthLogos from "@/components/Auth/AuthLogos";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:5173";

const MobileHide = styled.div`
  @media (max-width: 768px) {
    display: none;
  }
`;

function LoginForm() {
  const theme = useTheme();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const verifiedParam = (searchParams.get("verified") || "").toLowerCase();
    if (verifiedParam === "success") {
      setInfoMessage("Konto zostało potwierdzone. Możesz się zalogować.");
      setErrorMessage("");
    } else if (verifiedParam === "error") {
      setInfoMessage(null);
      setErrorMessage("Nie udało się zweryfikować adresu e-mail.");
    }
  }, [searchParams]);

  const submitLogin = async () => {
    setLoading(true);
    try {
      const tokens = await loginUser(email, password);
      // Store tokens and redirect to app dashboard
      if (typeof window !== "undefined") {
        localStorage.setItem("access_token", tokens.access_token);
        localStorage.setItem("refresh_token", tokens.refresh_token);
        window.location.href = `${APP_URL}/dashboard`;
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Nie udało się zalogować.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    await submitLogin();
  };

  return (
    <AuthLayout
      illustrationSrc="/login.webp"
      illustrationAlt="Ilustracja logowania do systemu InQUIZitor"
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
              <Link href="/register" style={{ color: theme.colors.brand.primary }}>
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
                <Link
                  href="/forgot-password"
                  style={{
                    color: theme.colors.brand.primary,
                    fontSize: "14px",
                    textDecoration: "none",
                  }}
                >
                  Zapomniałeś hasła?
                </Link>
              </div>

              {infoMessage && (
                <AlertBar variant="success">{infoMessage}</AlertBar>
              )}

              {errorMessage && (
                <AlertBar
                  variant={
                    errorMessage.includes("nie zostało jeszcze aktywowane")
                      ? "warning"
                      : "danger"
                  }
                >
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
  );
}

const LoginPage: React.FC = () => {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
};

export default LoginPage;
