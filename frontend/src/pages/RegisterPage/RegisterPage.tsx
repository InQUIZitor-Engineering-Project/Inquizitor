import React, { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import styled, { useTheme } from "styled-components";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { Stack, Heading, Text, Input, Button, Checkbox, Flex } from "../../design-system/primitives";
import AlertBar from "../../design-system/patterns/AlertBar";
import { registerUser } from "../../services/auth";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import loginIllustration from "../../assets/login.png";
import AuthLayout from "../Auth/components/AuthLayout";
import AuthLogos from "../Auth/components/AuthLogos";
import { Modal } from "../../design-system/patterns";

const MobileHide = styled.div`
  @media (max-width: 768px) {
    display: none;
  }
`;

const RegisterPage: React.FC = () => {
  const theme = useTheme();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileVerifying, setTurnstileVerifying] = useState(false);
  const [pendingTurnstileSubmit, setPendingTurnstileSubmit] = useState(false);
  const turnstileRef = useRef<TurnstileInstance | null>(null);

  const [touched, setTouched] = useState({
    email: false,
    password: false,
    confirmPassword: false,
  });

  const handleBlur = (field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  useEffect(() => {
    // keep for future side effects if needed
  }, [isModalOpen]);

  const isPasswordComplex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/.test(password);
  const isEmailValid = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/.test(email.trim());
  const isFormValid = 
    firstName.trim() !== "" &&
    lastName.trim() !== "" &&
    isEmailValid &&
    password !== "" &&
    password === confirmPassword &&
    isPasswordComplex &&
    termsAccepted;

  const submitRegistration = async (token?: string | null) => {
    setLoading(true);
    try {
      setSuccessMessage("");
      await registerUser({
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        turnstile_token: token,
      });
      setSuccessMessage("Sprawdź swoją skrzynkę e-mail, wysłaliśmy link aktywacyjny.");
    } catch (err: any) {
      const msg = String(err?.message || "Błąd rejestracji");
      setErrorMessage(msg);
    } finally {
      setLoading(false);
      if (import.meta.env.VITE_TURNSTILE_SITE_KEY) {
        setTurnstileToken(null);
        setTurnstileVerifying(false);
        setPendingTurnstileSubmit(false);
        turnstileRef.current?.reset();
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!isFormValid) return;

    if (import.meta.env.VITE_TURNSTILE_SITE_KEY && !turnstileToken) {
      setTurnstileVerifying(true);
      setPendingTurnstileSubmit(true);
      turnstileRef.current?.execute();
      return;
    }

    await submitRegistration(turnstileToken);
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
                {successMessage ? "Prawie gotowe!" : "Zarejestruj się"}
              </Heading>
              {!successMessage && (
                <Text $variant="body2" $tone="muted">
                  Masz już konto?{" "}
                  <Link to="/login" style={{ color: theme.colors.brand.primary }}>
                    Zaloguj się
                  </Link>
                </Text>
              )}
            </Stack>

            {successMessage ? (
              <Stack $gap="lg">
                <AlertBar variant="success">
                  {successMessage}
                </AlertBar>
                <Text $variant="body2" $tone="muted">
                  Po kliknięciu w link będziesz mógł zalogować się do swojego konta. 
                  Jeśli nie widzisz wiadomości, sprawdź folder Spam.
                </Text>
                <Button $variant="outline" $fullWidth onClick={() => window.location.href = "/login"}>
                  Wróć do logowania
                </Button>
              </Stack>
            ) : (
              <form onSubmit={handleSubmit}>
                <Stack $gap="md">
                  <Flex $gap="md" $wrap="wrap">
                    <Stack $gap="xs" as="label" htmlFor="firstName" style={{ flex: "1 1 160px" }}>
                      <Text as="span" $variant="body3" $tone="muted">
                        Imię *
                      </Text>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        $fullWidth
                        required
                      />
                    </Stack>

                    <Stack $gap="xs" as="label" htmlFor="lastName" style={{ flex: "1 1 160px" }}>
                      <Text as="span" $variant="body3" $tone="muted">
                        Nazwisko *
                      </Text>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        $fullWidth
                        required
                      />
                    </Stack>
                  </Flex>

                  <Stack $gap="xs" as="label" htmlFor="email">
                    <Text as="span" $variant="body3" $tone="muted">
                      Adres email *
                    </Text>
                    <Input
                      id="email"
                      type="email"
                      $fullWidth
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setTouched((prev) => ({ ...prev, email: false }));
                      }}
                      onBlur={() => handleBlur("email")}
                      required
                      style={touched.email && email && !isEmailValid ? { borderColor: theme.colors.danger.main } : {}}
                    />
                    {touched.email && email && !isEmailValid && (
                      <Text $variant="body4" $tone="danger" style={{ marginTop: '-4px' }}>
                        Niepoprawny format email
                      </Text>
                    )}
                  </Stack>

                  <Flex $gap="md" $wrap="wrap">
                    <Stack $gap="xs" as="label" htmlFor="password" style={{ flex: "1 1 160px" }}>
                      <Text as="span" $variant="body3" $tone="muted">
                        Hasło *
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

                    <Stack $gap="xs" as="label" htmlFor="confirmPassword" style={{ flex: "1 1 160px" }}>
                      <Text as="span" $variant="body3" $tone="muted">
                        Potwierdź hasło *
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
                  </Flex>

                  <Text $variant="body3" $tone="muted">
                    Użyj co najmniej 8 znaków, łącząc litery, cyfry i symbole
                  </Text>

                  <label style={{ display: "flex", alignItems: "center", gap: 8 }} htmlFor="showPassword">
                    <Checkbox
                      id="showPassword"
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
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      required
                    />
                    <Text $variant="body3" $tone="muted">
                      Akceptuję Warunki Użytkowania i Politykę Prywatności. * Oświadczam, że posiadam
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
                    <AlertBar variant="danger">
                      {errorMessage}
                    </AlertBar>
                  )}

                  <Button
                    type="submit"
                    $fullWidth
                    $size="lg"
                    disabled={loading || turnstileVerifying || !isFormValid}
                  >
                    {loading ? "Tworzę konto..." : "Stwórz konto →"}
                  </Button>
                </Stack>
              </form>
            )}
          </Stack>
        }
      />

      <Turnstile
        ref={turnstileRef}
        siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
        onSuccess={(token) => {
          setTurnstileToken(token);
          setTurnstileVerifying(false);
          if (pendingTurnstileSubmit) {
            setPendingTurnstileSubmit(false);
            submitRegistration(token);
          }
        }}
        onExpire={() => {
          setTurnstileToken(null);
          setTurnstileVerifying(false);
        }}
        onError={() => {
          setTurnstileToken(null);
          setTurnstileVerifying(false);
          setPendingTurnstileSubmit(false);
          setErrorMessage("Weryfikacja Turnstile nie powiodła się. Spróbuj ponownie.");
        }}
        options={{ size: "invisible", execution: "execute" }}
      />

      <Modal
        isOpen={isModalOpen}
        title="Warunki korzystania z generatora testów"
        onClose={() => setIsModalOpen(false)}
        maxWidth={720}
        confirmLabel="Rozumiem"
        onConfirm={() => setIsModalOpen(false)}
      >
        <Stack $gap="lg">
          <Stack $gap="sm">
            <Heading $level="h4" as="h4">
              1. Prawa Własności Intelektualnej
            </Heading>
            <Text $variant="body3">
              Użytkownik oświadcza, że jest właścicielem praw autorskich do przesłanych materiałów edukacyjnych (tekstów,
              plików, grafik) lub posiada stosowną licencję/zgodę na ich wykorzystanie. Korzystając z Aplikacji,
              Użytkownik udziela jej operatorowi ograniczonej, niewyłącznej, nieodpłatnej licencji na wykorzystanie
              przesłanych treści wyłącznie w celu i na czas niezbędny do wygenerowania testu.
            </Text>
          </Stack>

          <Stack $gap="sm">
            <Heading $level="h4" as="h4">
              2. Przetwarzanie Danych przez Model AI (Google Gemini)
            </Heading>
            <Text $variant="body3">
              Użytkownik przyjmuje do wiadomości i akceptuje fakt, że w celu świadczenia usługi (wygenerowania pytań
              testowych), treść przesłanych materiałów jest przekazywana do zewnętrznego dostawcy technologii – firmy
              Google LLC, za pośrednictwem interfejsu programistycznego Gemini API.
            </Text>
            <ul style={{ paddingLeft: 18, margin: 0 }}>
              <li>
                <Text $variant="body3">
                  Przekazanie danych jest niezbędne do technicznego wykonania usługi.
                </Text>
              </li>
              <li>
                <Text $variant="body3">
                  Dane są przetwarzane zgodnie z polityką prywatności i bezpieczeństwa Google Cloud AI.
                </Text>
              </li>
            </ul>
          </Stack>

          <Stack $gap="sm">
            <Heading $level="h4" as="h4">
              3. Odpowiedzialność Użytkownika
            </Heading>
            <Text $variant="body3">
              Użytkownik ponosi wyłączną odpowiedzialność za treść przesyłanych materiałów. Zabrania się przesyłania
              treści naruszających prawa osób trzecich, poufnych danych osobowych (RODO), treści obraźliwych lub
              niezgodnych z prawem.
            </Text>
          </Stack>

          <Stack $gap="sm">
            <Heading $level="h4" as="h4">
              4. Ograniczenie Odpowiedzialności
            </Heading>
            <Text $variant="body3">
              Testy generowane są automatycznie przez algorytmy sztucznej inteligencji (LLM). Mimo wysokiej skuteczności
              modeli językowych, system może generować odpowiedzi nieprecyzyjne lub błędne merytorycznie. Użytkownik
              zobowiązany jest do samodzielnej weryfikacji testu przed jego użyciem.
            </Text>
          </Stack>
        </Stack>
      </Modal>
    </>
  );
};

export default RegisterPage;
