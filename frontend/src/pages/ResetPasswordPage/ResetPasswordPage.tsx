import React, { useState, type FormEvent } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import styled, { useTheme } from "styled-components";
import { Stack, Heading, Text, Input, Button, Checkbox } from "../../design-system/primitives";
import AlertBar from "../../design-system/patterns/AlertBar";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import loginIllustration from "../../assets/login.png";
import AuthLayout from "../Auth/components/AuthLayout";
import AuthLogos from "../Auth/components/AuthLogos";
import { confirmPasswordReset } from "../../services/auth";

const MobileHide = styled.div`
  @media (max-width: 768px) {
    display: none;
  }
`;

const ResetPasswordPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const [touched, setTouched] = useState({
    password: false,
    confirmPassword: false,
  });

  const handleBlur = (field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  useDocumentTitle("Zresetuj hasło | Inquizitor");

  const isPasswordComplex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/.test(password);
  const isFormValid = password !== "" && password === confirmPassword && isPasswordComplex;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!token) {
      setErrorMessage("Brak tokenu resetującego w adresie URL.");
      return;
    }

    if (!isFormValid) return;

    setLoading(true);
    try {
      await confirmPasswordReset(token, password);
      setSuccess(true);
    } catch (err: any) {
      setErrorMessage(err?.message || "Nie udało się zresetować hasła.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
        <AuthLayout
          illustrationSrc={loginIllustration}
          illustrationAlt="Reset Password Error"
          left={
            <Stack $gap="lg">
              <MobileHide>
                <AuthLogos />
              </MobileHide>
              <Heading $level="h2">Błędny link</Heading>
              <AlertBar variant="danger">Link do resetowania hasła jest nieprawidłowy lub wygasł.</AlertBar>
              <Link to="/forgot-password" style={{ color: theme.colors.brand.primary }}>
                Poproś o nowy link
              </Link>
            </Stack>
          }
        />
    );
  }

  return (
    <AuthLayout
      illustrationSrc={loginIllustration}
      illustrationAlt="Reset Password Illustration"
      left={
        <Stack $gap="lg">
          <MobileHide>
            <AuthLogos />
          </MobileHide>

          <Stack $gap="xs">
            <Heading $level="h2" as="h1">
              {success ? "Hasło zmienione!" : "Ustaw nowe hasło"}
            </Heading>
            {!success && (
              <Text $variant="body2" $tone="muted">
                Wprowadź i potwierdź nowe hasło do Twojego konta.
              </Text>
            )}
          </Stack>

          {success ? (
            <Stack $gap="lg">
              <AlertBar variant="success">Twoje hasło zostało pomyślnie zmienione!</AlertBar>
              <Text $variant="body2" $tone="muted">
                Teraz możesz zalogować się do swojego konta przy użyciu nowego hasła.
              </Text>
              <Button $fullWidth $size="lg" onClick={() => navigate("/login")}>
                Przejdź do logowania
              </Button>
            </Stack>
          ) : (
            <form onSubmit={handleSubmit}>
              <Stack $gap="md">
                <Stack $gap="xs" as="label" htmlFor="password">
                  <Text as="span" $variant="body3" $tone="muted">
                    Nowe hasło
                  </Text>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    $fullWidth
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setTouched((prev) => ({ ...prev, password: false }));
                    }}
                    onBlur={() => handleBlur("password")}
                    required
                    style={touched.password && password && !isPasswordComplex ? { borderColor: theme.colors.danger.main } : {}}
                  />
                  {touched.password && password && !isPasswordComplex && (
                    <Text $variant="body4" $tone="danger" style={{ marginTop: '-4px' }}>
                      Min. 8 znaków, litera, cyfra i symbol.
                    </Text>
                  )}
                </Stack>

                <Stack $gap="xs" as="label" htmlFor="confirmPassword">
                  <Text as="span" $variant="body3" $tone="muted">
                    Potwierdź nowe hasło
                  </Text>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    $fullWidth
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setTouched((prev) => ({ ...prev, confirmPassword: false }));
                    }}
                    onBlur={() => handleBlur("confirmPassword")}
                    required
                    style={touched.confirmPassword && password && confirmPassword && password !== confirmPassword ? { borderColor: theme.colors.danger.main } : {}}
                  />
                  {touched.confirmPassword && password && confirmPassword && password !== confirmPassword && (
                    <Text $variant="body4" $tone="danger" style={{ marginTop: '-4px' }}>
                      Hasła nie są identyczne.
                    </Text>
                  )}
                </Stack>

                {errorMessage && <AlertBar variant="danger">{errorMessage}</AlertBar>}

                <Stack $gap="sm">
                  <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Checkbox
                      id="showPassword"
                      checked={showPassword}
                      onChange={(e) => setShowPassword(e.target.checked)}
                    />
                    <Text as="span" $variant="body3" $tone="muted">
                      Pokaż hasła
                    </Text>
                  </label>

                  <Button type="submit" $fullWidth $size="lg" disabled={loading || !isFormValid}>
                    {loading ? "Zmieniam…" : "Zmień hasło"}
                  </Button>
                </Stack>
              </Stack>
            </form>
          )}
        </Stack>
      }
    />
  );
};

export default ResetPasswordPage;

