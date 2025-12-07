import React, { useState, useEffect, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled, { useTheme } from "styled-components";
import { Stack, Heading, Text, Input, Button, Checkbox, Flex } from "../../design-system/primitives";
import { registerUser } from "../../services/auth";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import loginIllustration from "../../assets/login.png";
import AuthLayout from "../Auth/components/AuthLayout";
import AuthLogos from "../Auth/components/AuthLogos";
import TermsModal from "./components/TermsModal";

const MobileHide = styled.div`
  @media (max-width: 768px) {
    display: none;
  }
`;

const RegisterPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // keep for future side effects if needed
  }, [isModalOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("Hasła muszą być takie same");
      return;
    }

    if (!termsAccepted) {
      setErrorMessage("Wymagana jest akceptacja regulaminu.");
      return;
    }

    setLoading(true);
    try {
      await registerUser({
        first_name: firstName,  
        last_name: lastName,    
        email,
        password,
      });
      navigate("/login");
    } catch (err: any) {
      const msg = String(err?.message || "Błąd rejestracji");
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  useDocumentTitle("Rejestracja | Inquizitor");

  return (
    <>
      <AuthLayout
        illustrationSrc={loginIllustration}
        illustrationAlt="Rejestracja Illustration"
        left={
          <Stack $gap="lg">
          <MobileHide>
            <AuthLogos />
          </MobileHide>

            <Stack $gap="xs">
              <Heading $level="h2" as="h1">
                Zarejestruj się
              </Heading>
              <Text $variant="body2" $tone="muted">
                Masz już konto?{" "}
                <Link to="/login" style={{ color: theme.colors.brand.primary }}>
                  Zaloguj się
                </Link>
              </Text>
            </Stack>

            <form onSubmit={handleSubmit}>
              <Stack $gap="md">
                <Flex $gap="md" $wrap="wrap">
                  <Stack $gap="xs" as="label" htmlFor="firstName" style={{ flex: "1 1 160px" }}>
                    <Text as="span" $variant="body3" $tone="muted">
                      Imię
                    </Text>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      $fullWidth
                    />
                  </Stack>

                  <Stack $gap="xs" as="label" htmlFor="lastName" style={{ flex: "1 1 160px" }}>
                    <Text as="span" $variant="body3" $tone="muted">
                      Nazwisko
                    </Text>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      $fullWidth
                    />
                  </Stack>
                </Flex>

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
                  />
                </Stack>

                <Flex $gap="md" $wrap="wrap">
                  <Stack $gap="xs" as="label" htmlFor="password" style={{ flex: "1 1 160px" }}>
                    <Text as="span" $variant="body3" $tone="muted">
                      Hasło
                    </Text>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      $fullWidth
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </Stack>

                  <Stack $gap="xs" as="label" htmlFor="confirmPassword" style={{ flex: "1 1 160px" }}>
                    <Text as="span" $variant="body3" $tone="muted">
                      Potwierdź hasło
                    </Text>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      $fullWidth
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </Stack>
                </Flex>

                <Text $variant="body3" $tone="muted">
                  Użyj co najmniej 8 znaków, łącząc litery, cyfry i symbole
                </Text>

                <label style={{ display: "flex", alignItems: "center", gap: 8 }} htmlFor="showPassword">
                  <Checkbox
                    id="showPassword"
                    $size={18}
                    style={{ flexShrink: 0 }}
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                  />
                  <Text as="span" $variant="body3" $tone="muted">
                    Pokaż hasło
                  </Text>
                </label>

                <label style={{ display: "flex", alignItems: "flex-start", gap: 8 }} htmlFor="termsAccepted">
                  <Checkbox
                    id="termsAccepted"
                    $size={18}
                    style={{ flexShrink: 0 }}
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                  />
                  <Text $variant="body3" $tone="muted">
                    Akceptuję Warunki Użytkowania i Politykę Prywatności. Oświadczam, że posiadam
                    prawa do materiałów i wyrażam zgodę na ich przetworzenie przez AI.{" "}
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(true)}
                      style={{
                        background: "none",
                        border: "none",
                        color: theme.colors.brand.primary,
                        cursor: "pointer",
                        padding: 0,
                        textDecoration: "underline",
                      }}
                    >
                      Więcej informacji
                    </button>
                  </Text>
                </label>

                {errorMessage && (
                  <Text $variant="body3" $tone="danger">
                    {errorMessage}
                  </Text>
                )}

                <Button type="submit" $fullWidth $size="lg" disabled={loading}>
                  {loading ? "Tworzę konto..." : "Stwórz konto →"}
                </Button>
              </Stack>
            </form>
          </Stack>
        }
      />

      {isModalOpen && (
        <TermsModal onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
};

export default RegisterPage;