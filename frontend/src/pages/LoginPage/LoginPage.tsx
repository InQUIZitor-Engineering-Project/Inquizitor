import React, { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "styled-components";
import { Stack, Heading, Text, Input, Button, Checkbox } from "../../design-system/primitives";
import { useAuth } from "../../context/AuthContext";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import loginIllustration from "../../assets/login.png";
import AuthLayout from "../Auth/components/AuthLayout";
import AuthLogos from "../Auth/components/AuthLogos";

const LoginPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useDocumentTitle("Zaloguj się | Inquizitor");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      setErrorMessage(err?.message || "Nie udało się zalogować.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      illustrationSrc={loginIllustration}
      illustrationAlt="Login Illustration"
      left={
        <Stack $gap="lg">
          <AuthLogos />

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

              {errorMessage && (
                <Text $variant="body3" $tone="danger">
                  {errorMessage}
                </Text>
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
};

export default LoginPage;
