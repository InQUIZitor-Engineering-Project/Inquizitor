import React, { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import styled, { useTheme } from "styled-components";
import { Stack, Heading, Text, Input, Button } from "../../design-system/primitives";
import AlertBar from "../../design-system/patterns/AlertBar";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import loginIllustration from "../../assets/login.webp";
import AuthLayout from "../Auth/components/AuthLayout";
import AuthLogos from "../Auth/components/AuthLogos";
import { requestPasswordReset } from "../../services/auth";

const MobileHide = styled.div`
  @media (max-width: 768px) {
    display: none;
  }
`;

const ForgotPasswordPage: React.FC = () => {
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [touched, setTouched] = useState({
    email: false,
  });

  const handleBlur = () => {
    setTouched({ email: true });
  };

  useDocumentTitle("Zapomniałeś hasła? | Inquizitor");

  const isEmailValid = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/.test(email.trim());

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isEmailValid) return;
    
    setErrorMessage("");
    setSuccessMessage("");
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSuccessMessage("Jeśli podany adres e-mail istnieje w naszym systemie, wysłaliśmy na niego link do zresetowania hasła.");
    } catch (err: any) {
      setErrorMessage(err?.message || "Nie udało się zlecić resetowania hasła.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      illustrationSrc={loginIllustration}
      illustrationAlt="Forgot Password Illustration"
      left={
        <Stack $gap="lg">
          <MobileHide>
            <AuthLogos />
          </MobileHide>

          <Stack $gap="xs">
            <Heading $level="h2" as="h1">
              {successMessage ? "Sprawdź e-mail" : "Zapomniałeś hasła?"}
            </Heading>
            {!successMessage && (
              <Text $variant="body2" $tone="muted">
                Wprowadź swój adres e-mail, a wyślemy Ci link do zmiany hasła.
              </Text>
            )}
          </Stack>

          {successMessage ? (
            <Stack $gap="lg">
              <AlertBar variant="success">{successMessage}</AlertBar>
              <Text $variant="body2" $tone="muted">
                Jeśli nie widzisz wiadomości, sprawdź folder Spam. Link jest ważny przez 24 godziny.
              </Text>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <Button $fullWidth $variant="outline">Wróć do logowania</Button>
              </Link>
            </Stack>
          ) : (
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
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setTouched({ email: false });
                    }}
                    onBlur={handleBlur}
                    required
                    style={touched.email && email && !isEmailValid ? { borderColor: theme.colors.danger.main } : {}}
                  />
                  {touched.email && email && !isEmailValid && (
                    <Text $variant="body4" $tone="danger" style={{ marginTop: '-4px' }}>
                      Niepoprawny format email
                    </Text>
                  )}
                </Stack>

                {errorMessage && <AlertBar variant="danger">{errorMessage}</AlertBar>}

                <Stack $gap="sm">
                  <Button type="submit" $fullWidth $size="lg" disabled={loading || !isEmailValid}>
                    {loading ? "Wysyłanie…" : "Wyślij link do resetu"}
                  </Button>
                  <Link to="/login" style={{ textAlign: "center", color: theme.colors.brand.primary, fontSize: '14px' }}>
                    Wróć do logowania
                  </Link>
                </Stack>
              </Stack>
            </form>
          )}
        </Stack>
      }
    />
  );
};

export default ForgotPasswordPage;

