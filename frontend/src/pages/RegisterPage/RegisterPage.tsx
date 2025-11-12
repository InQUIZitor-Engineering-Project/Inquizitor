import React, { useState } from "react";
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
  MainContent
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

  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("Hasła muszą być takie same");
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
      setErrorMessage(err.message || "Błąd rejestracji");
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

              {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}

              <CheckboxWrapper htmlFor="showPassword">
                <input
                  type="checkbox"
                  id="showPassword"
                  checked={showPassword}
                  onChange={() => setShowPassword((prev) => !prev)}
                />
                <span>Pokaż hasło</span>
              </CheckboxWrapper>

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
    </PageWrapper>
  );
};


export default RegisterPage;
