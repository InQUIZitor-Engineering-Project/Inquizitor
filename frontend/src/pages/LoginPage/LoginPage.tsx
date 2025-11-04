import React, { useState } from "react";
import {
  PageWrapper,
  MainContent,
  Card,
  LeftColumn,
  Title,
  Subtitle,
  FormGrid,
  FullWidthField,
  FieldLabel,
  TextInput,
  CheckboxWrapper,
  SubmitButtonWrapper,
  RightColumn,
  Illustration,
  ErrorMessage
} from "./LoginPage.styles";

import { Logo, LogosWrapper } from "../../styles/common.ts"
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/Button/Button";
import { useAuth } from "../../context/AuthContext";
import Footer from "../../components/Footer/Footer";


const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };


    return (
    <PageWrapper>
      <MainContent>
        <Card>
          <LeftColumn>
            <LogosWrapper>
              <Logo src="/src/assets/logo_book.png" alt="Inquizitor Full Logo" />
              <Logo src="/src/assets/logo_tekst.png" alt="Inquizitor Icon Logo" />
            </LogosWrapper>

            <Title>Zaloguj się</Title>
            <Subtitle>
              Nie masz jeszcze konta?{" "}
              <Link to="/register">Zarejestruj się</Link>
            </Subtitle>

            <form onSubmit={handleSubmit}>
              <FormGrid>
                <FullWidthField>
                  <FieldLabel htmlFor="email">Adres email</FieldLabel>
                  <TextInput
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </FullWidthField>

                <FullWidthField>
                  <FieldLabel htmlFor="password">Hasło</FieldLabel>
                  <TextInput
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </FullWidthField>

                {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}

                <CheckboxWrapper htmlFor="showPassword">
                  <input
                    type="checkbox"
                    id="showPassword"
                    checked={showPassword}
                    onChange={() => setShowPassword((p) => !p)}
                  />
                  <span>Pokaż hasło</span>
                </CheckboxWrapper>

                <SubmitButtonWrapper>
                  <Button type="submit" variant="primary" disabled={loading}>
                    {loading ? "Loguję…" : "Zaloguj się →"}
                  </Button>
                </SubmitButtonWrapper>
              </FormGrid>
            </form>
          </LeftColumn>

          <RightColumn>
            <Illustration src="/src/assets/login.png" alt="Login Illustration" />
          </RightColumn>
        </Card>
      </MainContent>
      
      {/* 3. ADD FOOTER HERE */}
      <Footer />
    </PageWrapper>
  );
};

export default LoginPage;
