import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  NavbarContainer,
  NavHeader,
  NavContent,
  MobileToggle,
  NavLinks,
  StyledLink,
  ButtonGroup,
  LoginLink,
  RegisterButton,
  SidebarToggleButton,
  DesktopBar,
  RelativeContainer,
  NotificationBadge,
} from "./Navbar.styles";
import { Logo, LogosWrapper } from "../../styles/common";
import { useAuth } from "../../hooks/useAuth";
import { useLoader } from "../../components/Loader/GlobalLoader";
import logoBook from "../../assets/logo_book.webp";
import logoText from "../../assets/logo_text.webp";
import hamburgerIcon from "../../assets/hamburger.webp";
import { PageContainer } from "../../design-system/patterns";
import { Flex } from "../../design-system/primitives";

const Navbar: React.FC = () => {
  const { user, logout, unreadNotificationsCount } = useAuth();  const navigate = useNavigate();
  const location = useLocation();
  const { startLoading, stopLoading, withLoader } = useLoader();
  const [menuOpen, setMenuOpen] = useState(false);

  const [showSidebarToggle, setShowSidebarToggle] = useState(false);

  const closeMenu = () => setMenuOpen(false);
  const toggleSidebarDrawer = () =>
    window.dispatchEvent(new CustomEvent("inquizitor:toggle-sidebar"));

  const triggerQuickLoader = () => {
    closeMenu();
    startLoading();
    setTimeout(() => stopLoading(), 150);
  };

  const handleNavClick = (path: string) =>
    withLoader(async () => {
      closeMenu();
      navigate(path);
      await new Promise((res) => setTimeout(res, 250));
    });

  const handleLogout = async () => {
    await withLoader(async () => {
      closeMenu();
      await logout();
      navigate("/login", { replace: true });
    });
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && menuOpen) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [menuOpen]);

  useEffect(() => {
    const { pathname } = location;
    const shouldShow =
      pathname.startsWith("/tests/") || pathname.startsWith("/tests/new") || pathname === "/dashboard";
    setShowSidebarToggle(shouldShow);
  }, [location]);

  return (
    <NavbarContainer>
      <PageContainer>
        <DesktopBar>
          <Link to="/" onClick={triggerQuickLoader} style={{ minWidth: 0 }}>
            <LogosWrapper>
              <Logo src={logoBook} alt="Inquizitor Book Logo" />
              <Logo src={logoText} alt="Inquizitor Text Logo" />
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


            <StyledLink to="/pomoc" onClick={triggerQuickLoader}>
              Pomoc
            </StyledLink>
          </NavLinks>

          <ButtonGroup>
            {user ? (
              <>
                {showSidebarToggle && (
                  <SidebarToggleButton onClick={toggleSidebarDrawer}>Testy</SidebarToggleButton>
                )}
                <RegisterButton as="button" onClick={() => handleNavClick("/profile")}>
                      <RelativeContainer>
                        {user.first_name} →
                        {unreadNotificationsCount > 0 && (
                          <NotificationBadge>
                            {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
                          </NotificationBadge>
                        )}
                      </RelativeContainer>
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
        </DesktopBar>

        <NavHeader>
          <Link to="/" onClick={triggerQuickLoader} style={{ minWidth: 0 }}>
            <LogosWrapper>
              <Logo src={logoBook} alt="Inquizitor Book Logo" />
              <Logo src={logoText} alt="Inquizitor Text Logo" />
            </LogosWrapper>
          </Link>

          <Flex $align="center" $gap="xs">
            {user && showSidebarToggle && (
              <SidebarToggleButton onClick={toggleSidebarDrawer}>
                Testy
              </SidebarToggleButton>
            )}

            <MobileToggle
              aria-label="Przełącz nawigację"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <img src={hamburgerIcon} alt="" style={{ width: 24, height: 24 }} />
            </MobileToggle>
          </Flex>
        </NavHeader>

        <NavContent $open={menuOpen}>
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


            <StyledLink to="/pomoc" onClick={triggerQuickLoader}>
              Pomoc
            </StyledLink>
          </NavLinks>

          <ButtonGroup>
            {user ? (
              <>
                <RegisterButton as="button" onClick={() => handleNavClick("/profile")}>
                    {user.first_name} →
                    {unreadNotificationsCount > 0 && (
                      <NotificationBadge>
                        {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
                      </NotificationBadge>
                    )}
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
        </NavContent>
      </PageContainer>
    </NavbarContainer>
  );
};

export default Navbar;
