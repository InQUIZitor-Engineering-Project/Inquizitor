import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  NavbarContainer,
  NavLinks,
  StyledLink,
  ButtonGroup,
  LoginLink,
  RegisterButton,
} from "./Navbar.styles";
import { Logo, LogosWrapper } from "../../styles/common";
import { useAuth } from "../../context/AuthContext";

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <NavbarContainer>
      <Link to="/">
        <LogosWrapper>
          <Logo src="/src/assets/logo_book.png" alt="Inquizitor Book Logo" />
          <Logo src="/src/assets/logo_tekst.png" alt="Inquizitor Text Logo" />
        </LogosWrapper>
      </Link>

      <NavLinks>
        <StyledLink to="/">Strona główna</StyledLink>
        <StyledLink to="/">O nas</StyledLink>
        <StyledLink to="/">Jak to działa?</StyledLink>
        <StyledLink to="/">FAQ</StyledLink>
      </NavLinks>

      <ButtonGroup>
        {user ? (
          <>
            <RegisterButton
              as={Link}
              to="/profile"
              onClick={() => navigate("/profile")}
            >
              {user.first_name} →
            </RegisterButton>
            <LoginLink as="button" onClick={logout}>
              Wyloguj
            </LoginLink>
          </>
        ) : (
          <>
            <LoginLink as={Link} to="/login">Zaloguj się</LoginLink>
            <RegisterButton as={Link} to="/register">Zarejestruj się</RegisterButton>
          </>
        )}
      </ButtonGroup>
    </NavbarContainer>
  );
};

export default Navbar;
