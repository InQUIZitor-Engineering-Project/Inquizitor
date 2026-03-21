import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  NavbarContainer,
  NavHeader,
  NavContent,
  MobileToggle,
  NavLinks,
  StyledLink,
  ExternalStyledLink,
  ButtonGroup,
  LoginLink,
  RegisterButton,
  SidebarToggleButton,
  DesktopBar,
  RelativeContainer,
  NotificationBadge,
} from "./Navbar.styles";
import styled, { useTheme } from "styled-components";
import { Logo, LogosWrapper } from "../../styles/common";
import { useAuth } from "../../hooks/useAuth";
import { useLoader } from "../../components/Loader/GlobalLoader";
import logoBook from "../../assets/logo_book.webp";
import logoText from "../../assets/logo_text.webp";
import hamburgerIcon from "../../assets/hamburger.webp";
import userAvatarIcon from "../../assets/profilenavbaricon.webp";
import { PageContainer } from "../../design-system/patterns";
import { Flex, Box, Text} from "../../design-system/primitives";

const UserMenuContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
`;

const AvatarButton = styled.button`
  background: ${({ theme }) => theme.colors.neutral.white};
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  min-width: 52px;
  min-height: 52px;
  box-sizing: border-box;
  border-radius: 50%;
  overflow: visible;
  position: relative;
  transition: all 0.2s ease;
  line-height: 0;
  flex-shrink: 0;
  box-shadow: ${({ theme }) => theme.shadows["2px"]};

  &:hover {
    transform: scale(1.05);
    background-color: ${({ theme }) => theme.colors.neutral.silver};
    box-shadow: ${({ theme }) => theme.shadows["4px"]};
  }
`;

const AvatarImageWrapper = styled.div`
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
`;

const DropdownMenu = styled.div<{ $open: boolean }>`
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: ${({ theme }) => theme.colors.neutral.white};
  border-radius: 12px;
  box-shadow: ${({ theme }) => theme.shadows["4px"]};
  width: max-content;
  min-width: 200px;
  padding: 8px;
  display: ${({ $open }) => ($open ? "block" : "none")};
  z-index: 1000;
  border: 1px solid ${({ theme }) => theme.colors.neutral.greyBlue};
  animation: fadeInCentered 0.2s ease-out;

  @keyframes fadeInCentered {
    from { opacity: 0; transform: translate(-50%, -10px); }
    to { opacity: 1; transform: translate(-50%, 0); }
  }

  @media (max-width: 768px) {
    position: static;
    transform: none;
    box-shadow: none;
    border: none;
    padding: 0;
    width: 100%;
    display: block;
    margin-top: 8px;
    animation: none;
  }
`;

const DropdownItem = styled.button`
  width: 100%;
  text-align: left;
  padding: 10px 16px;
  background: none;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  transition: all 0.2s;
  color: ${({ theme }) => theme.colors.neutral.dGrey};
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;

  &:hover {
    background-color: ${({ theme }) => theme.colors.tint.t5};
    color: ${({ theme }) => theme.colors.brand.primary};
  }

  @media (max-width: 768px) {
    padding: 14px 16px;
    font-size: 15px;
    background-color: ${({ theme }) => theme.colors.tint.t5};
    margin-bottom: 6px;
    justify-content: center;
    text-align: center;
  }
`;

const MobileGreeting = styled(Box)`
  padding: 12px 16px;
  margin-bottom: 8px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.tint.t5};
  text-align: center;
`;

const SITE_URL = import.meta.env.VITE_SITE_URL ?? "https://inquizitor.pl";

const Navbar: React.FC = () => {
  const { user, logout, unreadNotificationsCount } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { startLoading, stopLoading, withLoader } = useLoader();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const [showSidebarToggle, setShowSidebarToggle] = useState(false);

  const closeMenu = () => {
    setMenuOpen(false);
    setUserMenuOpen(false);
  };
  
  const toggleUserMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUserMenuOpen(!userMenuOpen);
  };

  useEffect(() => {
    const handleClickOutside = () => setUserMenuOpen(false);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

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

  const UserMenu = ({ isMobile = false }: { isMobile?: boolean }) => {
    return (
      <UserMenuContainer onClick={(e) => isMobile && e.stopPropagation()}>
        {!isMobile && (
          <AvatarButton onClick={toggleUserMenu}>
            <RelativeContainer>
                <AvatarImageWrapper>
                  <AvatarImage src={userAvatarIcon} alt="Awatar użytkownika" />
                </AvatarImageWrapper>
{/* TODO: temporary – zawsze pokazuj badge do testów; usunąć */}
                {unreadNotificationsCount > 0 && (
                  <NotificationBadge style={{ transform: "translate(20%, -20%)" }}>
                    {(unreadNotificationsCount || 3) > 9 ? "9+" : (unreadNotificationsCount || 3)}
                  </NotificationBadge>
                )}
            </RelativeContainer>
          </AvatarButton>
        )}
        
        <DropdownMenu $open={isMobile ? true : userMenuOpen}>
          {isMobile && (
            <MobileGreeting>
              <Text $variant="body2" $weight="medium" $tone="default">
                Cześć, {user?.first_name}!
              </Text>
            </MobileGreeting>
          )}
          <DropdownItem onClick={() => handleNavClick("/profile")}>
            Strona profilowa
          </DropdownItem>
          <DropdownItem onClick={() => handleNavClick("/settings")}>
            Ustawienia konta
          </DropdownItem>
          <DropdownItem onClick={handleLogout} style={{ borderTop: isMobile ? "none" : `1px solid ${theme.colors.neutral.greyBlue}`, marginTop: isMobile ? 0 : 4, paddingTop: isMobile ? 12 : 12, color: theme.colors.danger.main }}>
            Wyloguj
          </DropdownItem>
        </DropdownMenu>
      </UserMenuContainer>
    );
  };

  const isPathActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <NavbarContainer>
      <PageContainer>
        <DesktopBar>
          {user ? (
            <Link to="/dashboard" onClick={triggerQuickLoader} style={{ minWidth: 0 }}>
              <LogosWrapper>
                <Logo src={logoBook} alt="Inquizitor Book Logo" />
                <Logo src={logoText} alt="Inquizitor Text Logo" />
              </LogosWrapper>
            </Link>
          ) : (
            <a href={SITE_URL} style={{ minWidth: 0 }}>
              <LogosWrapper>
                <Logo src={logoBook} alt="Inquizitor Book Logo" />
                <Logo src={logoText} alt="Inquizitor Text Logo" />
              </LogosWrapper>
            </a>
          )}

          <NavLinks>
            {user ? (
              <>
                <StyledLink to="/dashboard" onClick={triggerQuickLoader} $active={isPathActive("/dashboard")}>
                  Panel główny
                </StyledLink>
                <StyledLink to="/biblioteka" onClick={triggerQuickLoader} $active={isPathActive("/biblioteka")}>
                  Biblioteka
                </StyledLink>
                <StyledLink to="/pomoc" onClick={triggerQuickLoader} $active={isPathActive("/pomoc")}>
                  Pomoc
                </StyledLink>
              </>
            ) : (
              <>
                <ExternalStyledLink href={SITE_URL}>
                  Strona główna
                </ExternalStyledLink>
                <ExternalStyledLink href={`${SITE_URL}/o-nas`}>
                  O nas
                </ExternalStyledLink>
                <ExternalStyledLink href={`${SITE_URL}/pomoc`}>
                  Pomoc
                </ExternalStyledLink>
              </>
            )}
          </NavLinks>

          <ButtonGroup>
            {user ? (
              <>
                {showSidebarToggle && (
                  <SidebarToggleButton onClick={toggleSidebarDrawer}>Testy</SidebarToggleButton>
                )}
                <UserMenu />
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
          {user ? (
            <Link to="/dashboard" onClick={triggerQuickLoader} style={{ minWidth: 0 }}>
              <LogosWrapper>
                <Logo src={logoBook} alt="Inquizitor Book Logo" />
                <Logo src={logoText} alt="Inquizitor Text Logo" />
              </LogosWrapper>
            </Link>
          ) : (
            <a href={SITE_URL} style={{ minWidth: 0 }}>
              <LogosWrapper>
                <Logo src={logoBook} alt="Inquizitor Book Logo" />
                <Logo src={logoText} alt="Inquizitor Text Logo" />
              </LogosWrapper>
            </a>
          )}

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
              <img src={hamburgerIcon} alt="Otwórz menu" style={{ width: 24, height: 24 }} />
            </MobileToggle>
          </Flex>
        </NavHeader>

        <NavContent $open={menuOpen}>
          <NavLinks>
            {user ? (
              <>
                <StyledLink to="/dashboard" onClick={triggerQuickLoader} $active={isPathActive("/dashboard")}>
                  Panel główny
                </StyledLink>
                <StyledLink to="/biblioteka" onClick={triggerQuickLoader} $active={isPathActive("/biblioteka")}>
                  Biblioteka
                </StyledLink>
                <StyledLink to="/pomoc" onClick={triggerQuickLoader} $active={isPathActive("/pomoc")}>
                  Pomoc
                </StyledLink>
              </>
            ) : (
              <>
                <ExternalStyledLink href={SITE_URL}>
                  Strona główna
                </ExternalStyledLink>
                <ExternalStyledLink href={`${SITE_URL}/o-nas`}>
                  O nas
                </ExternalStyledLink>
                <ExternalStyledLink href={`${SITE_URL}/pomoc`}>
                  Pomoc
                </ExternalStyledLink>
              </>
            )}
          </NavLinks>

          <ButtonGroup>
            {user ? (
              <UserMenu isMobile />
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
