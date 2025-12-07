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

const ContentFlex = styled(Flex)`
  align-items: center;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xl};

  ${({ theme }) => theme.media.down("lg")} {
    flex-direction: column;
    align-items: stretch;
    gap: ${({ theme }) => theme.spacing.lg};

    > * {
      flex: 1 1 100%;
      min-width: 0;
    }
  }
`;

const Illustration = styled(Box)`
  width: 100%;
  max-width: 420px;

  ${({ theme }) => theme.media.down("sm")} {
    max-width: 320px;
    margin: 0 auto;
  }
`;

const LeftColumn = styled(Box)`
  flex: 1 1 360px;
  min-width: 300px;

  ${({ theme }) => theme.media.down("lg")} {
    min-width: 0;
    flex: 1 1 100%;
  }
`;

const IllustrationColumn = styled(Flex)`
  flex: 1 1 280px;
  min-width: 240px;

  ${({ theme }) => theme.media.down("lg")} {
    min-width: 0;
    flex: 1 1 100%;
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
              <ContentFlex>
                <LeftColumn>{left}</LeftColumn>

                <IllustrationColumn $justify="center" $align="center">
                  <Illustration
                    as="img"
                    src={illustrationSrc}
                    alt={illustrationAlt}
                    style={{ width: "100%", objectFit: "contain" }}
                  />
                </IllustrationColumn>
              </ContentFlex>
            </Box>
          </Flex>
        </PageContainer>
      </Inner>
    </Outer>
  );
};

export default AuthLayout;
