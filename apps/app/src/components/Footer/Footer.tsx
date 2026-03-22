import React from "react";
import { Box, Flex, Text } from "../../design-system/primitives";
import { PageContainer } from "../../design-system/patterns";
import styled from "styled-components";

const SITE_URL = import.meta.env.VITE_SITE_URL ?? "https://inquizitor.pl";

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

const FooterLink = styled.a`
  font-family: ${({ theme }) => theme.typography.body.regular.body3.fontFamily};
  font-size: ${({ theme }) => theme.typography.body.regular.body3.fontSize};
  font-weight: 500;
  line-height: ${({ theme }) => theme.typography.body.regular.body3.lineHeight};
  color: ${({ theme }) => theme.colors.neutral.dGrey};
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
  return (
    <FooterWrapper>
      <FooterInner>
        <Box as="div">
          <LinksRow $gap="lg" $align="center">
            <FooterLink href={`${SITE_URL}/o-nas`}>O nas</FooterLink>
            <Divider />
            <FooterLink href={`${SITE_URL}/pomoc`}>Pomoc</FooterLink>
            <Divider />
            <FooterLink href={`${SITE_URL}/polityka-prywatnosci`}>Polityka prywatności</FooterLink>
          </LinksRow>
          <CopyrightRow $align="center">
            <Text $variant="body4" $tone="muted">
              © {new Date().getFullYear()} Inquizitor. Wszelkie prawa zastrzeżone.
            </Text>
          </CopyrightRow>
        </Box>
      </FooterInner>
    </FooterWrapper>
  );
};

export default Footer;
