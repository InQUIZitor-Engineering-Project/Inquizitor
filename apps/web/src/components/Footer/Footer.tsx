"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, Flex, Text, PageContainer } from "@inquizitor/ui";
import styled from "styled-components";

const FooterWrapper = styled.footer`
  width: 100%;
  margin-top: auto;
  background-color: ${({ theme }) => theme.colors.neutral.white};
  border-top: 1px solid ${({ theme }) => theme.colors.neutral.whiteStroke};
`;

const FooterInner = styled(PageContainer)`
  padding-top: ${({ theme }) => theme.spacing.xl};
  padding-bottom: ${({ theme }) => theme.spacing.xl};
`;

const LinksRow = styled(Flex)`
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.lg};
  align-items: center;
  justify-content: center;
`;

const FooterLink = styled(Link)<{ $active?: boolean }>`
  font-family: ${({ theme }) => theme.typography.body.regular.body3.fontFamily};
  font-size: ${({ theme }) => theme.typography.body.regular.body3.fontSize};
  font-weight: 500;
  line-height: ${({ theme }) => theme.typography.body.regular.body3.lineHeight};
  color: ${({ theme, $active }) =>
    $active ? theme.colors.brand.primary : theme.colors.neutral.dGrey};
  text-decoration: none;
  transition: color 0.15s ease;

  &:hover {
    color: ${({ theme }) => theme.colors.brand.primary};
  }
`;

const Divider = styled.span`
  display: none;
  width: 1px;
  height: 14px;
  background-color: ${({ theme }) => theme.colors.neutral.greyBlue};
  flex-shrink: 0;

  ${({ theme }) => theme.media.up("md")} {
    display: block;
  }
`;

const CopyrightRow = styled(Flex)`
  margin-top: ${({ theme }) => theme.spacing.lg};
  padding-top: ${({ theme }) => theme.spacing.lg};
  border-top: 1px solid ${({ theme }) => theme.colors.neutral.whiteStroke};
  justify-content: center;
`;

const Footer: React.FC = () => {
  const pathname = usePathname();

  return (
    <FooterWrapper>
      <FooterInner>
        <Box as="div">
          <LinksRow $gap="lg" $align="center">
            <FooterLink href="/about" $active={pathname === "/about"}>
              O nas
            </FooterLink>
            <Divider />
            <FooterLink href="/pomoc" $active={pathname === "/pomoc"}>
              Pomoc
            </FooterLink>
            <Divider />
            <FooterLink
              href="/warunki-korzystania"
              $active={pathname === "/warunki-korzystania"}
            >
              Warunki korzystania
            </FooterLink>
            <Divider />
            <FooterLink
              href="/polityka-prywatnosci"
              $active={pathname === "/polityka-prywatnosci"}
            >
              Polityka prywatności
            </FooterLink>
          </LinksRow>
          <CopyrightRow $align="center">
            <Text $variant="body4" $tone="muted">
              © {new Date().getFullYear()} Inquizitor. Wszelkie prawa
              zastrzeżone.
            </Text>
          </CopyrightRow>
        </Box>
      </FooterInner>
    </FooterWrapper>
  );
};

export default Footer;
