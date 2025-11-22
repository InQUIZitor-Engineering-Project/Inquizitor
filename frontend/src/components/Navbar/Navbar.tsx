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
import { HashLink } from "react-router-hash-link";
import { useLoader } from "../../components/Loader/GlobalLoader";

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { startLoading, stopLoading, withLoader } = useLoader();

  const triggerQuickLoader = () => {
    startLoading();
    setTimeout(() => stopLoading(), 150);
  };

  const handleNavClick = (path: string) =>
    withLoader(async () => {
      navigate(path);
      await new Promise((res) => setTimeout(res, 250));
    });

  const handleLogout = async () => {
    await withLoader(async () => {
      await logout();
      navigate("/login", { replace: true });
    });
  };

  return (
    <NavbarContainer>
      <Link to="/" onClick={triggerQuickLoader} style={{ minWidth: 0 }}>
        <LogosWrapper>
          <Logo src="/src/assets/logo_book.png" alt="Inquizitor Book Logo" />
          <Logo src="/src/assets/logo_tekst.png" alt="Inquizitor Text Logo" />
        </LogosWrapper>
      </Link>

      <NavLinks>
        <StyledLink to="/" onClick={triggerQuickLoader}>
          Strona główna
        </StyledLink>

        {user && (
          <StyledLink to="/dashboard" onClick={triggerQuickLoader}>
            Panel główny
          </StyledLink>
        )}

        <StyledLink to="/about" onClick={triggerQuickLoader}>
          O nas
        </StyledLink>

        <StyledLink
          as={HashLink}
          to="/#how-it-works"
          smooth
          onClick={triggerQuickLoader}
        >
          Jak to działa?
        </StyledLink>

        <StyledLink to="/faq" onClick={triggerQuickLoader}>
          FAQ
        </StyledLink>
      </NavLinks>

      <ButtonGroup>
        {user ? (
          <>
            <RegisterButton as="button" onClick={() => handleNavClick("/profile")}>
              {user.first_name} →
            </RegisterButton>
            <LoginLink as="button" onClick={handleLogout}>
              Wyloguj
            </LoginLink>
          </>
        ) : (
          <>
            <LoginLink as="button" onClick={() => handleNavClick("/login")}>
              Zaloguj się
            </LoginLink>
            <RegisterButton as="button" onClick={() => handleNavClick("/register")}>
              Zarejestruj się
            </RegisterButton>
          </>
        )}
      </ButtonGroup>
    </NavbarContainer>
  );
};

export default Navbar;
