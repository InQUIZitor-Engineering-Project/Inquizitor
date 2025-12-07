import React from "react";
import styled from "styled-components";
import { Box, Flex } from "../../../design-system/primitives";
import { NAVBAR_HEIGHT } from "../../../components/Navbar/Navbar.styles";
import { PageContainer } from "../../../design-system/patterns";

const Outer = styled(Flex)`
  min-height: calc(100vh - ${NAVBAR_HEIGHT}px);
  background: ${({ theme }) => theme.colors.tint.t4};
  box-sizing: border-box;
  overflow: hidden;

  ${({ theme }) => theme.media.down("lg")} {
    padding-top: ${({ theme }) => theme.spacing.lg};
    padding-bottom: ${({ theme }) => theme.spacing.lg};
    align-items: flex-start;
  }

  ${({ theme }) => theme.media.down("sm")} {
    min-height: auto;
    height: auto;
    overflow: auto;
    padding-top: ${({ theme }) => theme.pagePadding.sm};
    padding-bottom: ${({ theme }) => theme.pagePadding.sm};
  }
`;

const Inner = styled(Flex)`
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  overflow: hidden;

  ${({ theme }) => theme.media.down("sm")} {
    align-items: flex-start;
    justify-content: flex-start;
    height: auto;
    min-height: 100vh;
    padding-top: ${({ theme }) => theme.pagePadding.sm};
    padding-bottom: ${({ theme }) => theme.pagePadding.sm};
  }
`;

interface AuthLayoutProps {
  left: React.ReactNode;
  illustrationSrc: string;
  illustrationAlt: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ left, illustrationSrc, illustrationAlt }) => {
  return (
    <Outer $direction="column">
      <Inner $flex={1} $align="center" $justify="center">
        <PageContainer>
          <Flex $justify="center">
            <Box
              $bg="#fff"
              $radius="xl"
              $shadow="md"
              $p="xl"
              style={{ width: "100%", maxWidth: 960 }}
            >
              <Flex $gap="xl" $wrap="wrap" style={{ alignItems: "center" }}>
                <Box style={{ flex: "1 1 360px", minWidth: 300 }}>{left}</Box>

                <Flex $justify="center" $align="center" style={{ flex: "1 1 280px", minWidth: 240 }}>
                  <Box
                    as="img"
                    src={illustrationSrc}
                    alt={illustrationAlt}
                    style={{ width: "100%", maxWidth: 420, objectFit: "contain" }}
                  />
                </Flex>
              </Flex>
            </Box>
          </Flex>
        </PageContainer>
      </Inner>
    </Outer>
  );
};

export default AuthLayout;
