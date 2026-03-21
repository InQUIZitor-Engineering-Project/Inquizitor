"use client";
import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
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
  DesktopBar,
} from "./Navbar.styles";
import { LogosWrapper, Logo, PageContainer, Flex } from "@inquizitor/ui";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:5173";

const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && menuOpen) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [menuOpen]);

  const isPathActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  return (
    <NavbarContainer>
      <PageContainer>
        <DesktopBar>
          <Link href="/" style={{ minWidth: 0 }}>
            <LogosWrapper>
              <Logo src="/logo_book.webp" alt="Inquizitor Book Logo" />
              <Logo src="/logo_text.webp" alt="Inquizitor Text Logo" />
            </LogosWrapper>
          </Link>

          <NavLinks>
            <StyledLink href="/" $active={isPathActive("/")}>
              Strona główna
            </StyledLink>
            <StyledLink href="/about" $active={isPathActive("/about")}>
              O nas
            </StyledLink>
            <StyledLink href="/pomoc" $active={isPathActive("/pomoc")}>
              Pomoc
            </StyledLink>
          </NavLinks>

          <ButtonGroup>
            <LoginLink href={`${APP_URL}/login`}>Zaloguj się</LoginLink>
            <RegisterButton href={`${APP_URL}/register`}>
              Zarejestruj się
            </RegisterButton>
          </ButtonGroup>
        </DesktopBar>

        <NavHeader>
          <Link href="/" style={{ minWidth: 0 }}>
            <LogosWrapper>
              <Logo src="/logo_book.webp" alt="Inquizitor Book Logo" />
              <Logo src="/logo_text.webp" alt="Inquizitor Text Logo" />
            </LogosWrapper>
          </Link>

          <Flex $align="center" $gap="xs">
            <MobileToggle
              aria-label="Przełącz nawigację"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <img
                src="/hamburger.webp"
                alt="Otwórz menu"
                style={{ width: 24, height: 24 }}
              />
            </MobileToggle>
          </Flex>
        </NavHeader>

        <NavContent $open={menuOpen}>
          <NavLinks>
            <StyledLink href="/" $active={isPathActive("/")} onClick={closeMenu}>
              Strona główna
            </StyledLink>
            <StyledLink
              href="/about"
              $active={isPathActive("/about")}
              onClick={closeMenu}
            >
              O nas
            </StyledLink>
            <StyledLink
              href="/pomoc"
              $active={isPathActive("/pomoc")}
              onClick={closeMenu}
            >
              Pomoc
            </StyledLink>
          </NavLinks>

          <ButtonGroup>
            <LoginLink href={`${APP_URL}/login`}>Zaloguj się</LoginLink>
            <RegisterButton href={`${APP_URL}/register`}>
              Zarejestruj się
            </RegisterButton>
          </ButtonGroup>
        </NavContent>
      </PageContainer>
    </NavbarContainer>
  );
};

export default Navbar;
