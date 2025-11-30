import React, { useState, useEffect } from "react";
import {
  PageWrapper,
  Card,
  LeftColumn,
  Title,
  Subtitle,
  FormGrid,
  FullWidthField,
  FieldLabel,
  TextInput,
  Notes,
  CheckboxWrapper,
  SubmitButtonWrapper,
  RightColumn,
  Illustration,
  ErrorMessage,
  MainContent,
  ModalOverlay,
  ModalContent,
  LinkButton,
  CloseButton,
} from "./RegisterPage.styles";
import { Logo, LogosWrapper } from "../../styles/common.ts"
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/Button/Button";
import { registerUser } from "../../services/auth";
import Footer from "../../components/Footer/Footer.tsx";
import useDocumentTitle from "../../components/GeneralComponents/Hooks/useDocumentTitle.ts";

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [termsHtml, setTermsHtml] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isModalOpen && !termsHtml) {
      fetch("/terms.html")
        .then((response) => {
            if (!response.ok) throw new Error("Failed to load terms");
            return response.text();
        })
        .then((data) => setTermsHtml(data))
        .catch((err) => {
            console.error(err);
            setTermsHtml("<p>Błąd ładowania regulaminu. Proszę spróbować później.</p>");
        });
    }
  }, [isModalOpen, termsHtml]);

  const handleSubmit = async (e: React.FormEvent) => {
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
    <PageWrapper>
      <MainContent>
        <Card>
          <LeftColumn>
            <LogosWrapper>
              <Logo src="/src/assets/logo_book.png" alt="Inquizitor Full Logo" />
              <Logo src="/src/assets/logo_tekst.png" alt="Inquizitor Icon Logo" />
            </LogosWrapper>

            <Title>Zarejestruj się</Title>
            <Subtitle>
              Masz już konto?{" "}
              <Link to="/login">Zaloguj się</Link>
            </Subtitle>

            <form onSubmit={handleSubmit}>
              <FormGrid>
                <div>
                  <FieldLabel htmlFor="firstName">Imię</FieldLabel>
                  <TextInput
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>

                <div>
                  <FieldLabel htmlFor="lastName">Nazwisko</FieldLabel>
                  <TextInput
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>

                <FullWidthField>
                  <FieldLabel htmlFor="email">Adres email</FieldLabel>
                  <TextInput
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </FullWidthField>

                <div>
                  <FieldLabel htmlFor="password">Hasło</FieldLabel>
                  <TextInput
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div>
                  <FieldLabel htmlFor="confirmPassword">Potwierdź hasło</FieldLabel>
                  <TextInput
                    type={showPassword ? "text" : "password"}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                <Notes>
                  Użyj co najmniej 8 znaków, łącząc litery, cyfry i symbole
                </Notes>

                <CheckboxWrapper htmlFor="showPassword">
                  <input
                    type="checkbox"
                    id="showPassword"
                    checked={showPassword}
                    onChange={() => setShowPassword((prev) => !prev)}
                  />
                  <span>Pokaż hasło</span>
                </CheckboxWrapper>

                <CheckboxWrapper htmlFor="termsAccepted">
                  <input
                    type="checkbox"
                    id="termsAccepted"
                    checked={termsAccepted}
                    onChange={() => setTermsAccepted((prev) => !prev)}
                  />
                  <span>
                    Akceptuję Warunki Użytkowania i Politykę Prywatności. Oświadczam, że posiadam prawa do materiałów i wyrażam zgodę na ich przetworzenie przez AI.{" "}
                    <LinkButton type="button" onClick={() => setIsModalOpen(true)}>
                        Więcej informacji
                    </LinkButton>
                  </span>
                </CheckboxWrapper>  

                {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}

                <SubmitButtonWrapper>
                  <Button type="submit" variant="primary" disabled={loading}>
                    {loading ? "Tworzę konto..." : "Stwórz konto →"}
                  </Button>
                </SubmitButtonWrapper>
              </FormGrid>
            </form>
          </LeftColumn>

          <RightColumn>
            <Illustration src="/src/assets/login.png" alt="Rejestracja Illustration" />
          </RightColumn>
        </Card>
      </MainContent>
      <Footer/>

      {isModalOpen && (
              <ModalOverlay onClick={() => setIsModalOpen(false)}>
                <ModalContent onClick={(e) => e.stopPropagation()}>
                  <CloseButton onClick={() => setIsModalOpen(false)}>&times;</CloseButton>
                  
                  {/* Render the fetched HTML safely */}
                  {termsHtml ? (
                      <div dangerouslySetInnerHTML={{ __html: termsHtml }} />
                  ) : (
                      <p style={{textAlign: 'center', padding: '20px'}}>Ładowanie treści...</p>
                  )}

                  <div style={{marginTop: '20px', textAlign: 'right'}}>
                      <Button variant="primary" onClick={() => setIsModalOpen(false)}>Zamknij</Button>
                  </div>
                </ModalContent>
              </ModalOverlay>
            )}
      
    </PageWrapper>
  );
};

export default RegisterPage;