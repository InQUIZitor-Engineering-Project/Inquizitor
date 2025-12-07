import React from "react";
import { useTheme } from "styled-components";
import styled from "styled-components";
import { Box, Flex } from "../../../design-system/primitives";
import { NAVBAR_HEIGHT } from "../../../components/Navbar/Navbar.styles";

const AuthShell = styled(Flex)`
  min-height: calc(100vh - ${NAVBAR_HEIGHT}px);
  height: auto;
  overflow: auto;
  box-sizing: border-box;
`;

const AuthContainer = styled(Flex)`
  width: 100%;
  height: 100%;
  padding: 64px 24px;
  box-sizing: border-box;

  ${({ theme }) => theme.media.down("md")} {
    padding: 32px 16px;
  }
`;

const Card = styled(Box)`
  width: 100%;
  max-width: 720px;
  padding: 32px;

  ${({ theme }) => theme.media.down("md")} {
    padding: 24px;
    max-width: 620px;
  }
`;

const CardGrid = styled(Flex)`
  gap: 24px;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
`;

const LeftCol = styled(Box)`
  flex: 1 1 420px;
  min-width: 280px;
  max-width: 520px;
  width: 100%;

  ${({ theme }) => theme.media.down("md")} {
    flex: 1 1 100%;
    max-width: 520px;
  }
`;

const IllustrationCol = styled(Flex)`
  flex: 1 1 320px;
  min-width: 260px;
  max-width: 520px;
  justify-content: center;
  align-items: center;

  ${({ theme }) => theme.media.down("md")} {
    max-width: 360px;
  }
`;

interface AuthLayoutProps {
  left: React.ReactNode;
  illustrationSrc: string;
  illustrationAlt: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ left, illustrationSrc, illustrationAlt }) => {
  const theme = useTheme();

  return (
    <AuthShell $direction="column" $bg={theme.colors.tint.t4}>
      <AuthContainer $flex={1} $align="center" $justify="center">
        <Card $bg="#fff" $radius="xl" $shadow="md">
          <CardGrid>
            <LeftCol>{left}</LeftCol>

            <IllustrationCol>
              <Box
                as="img"
                src={illustrationSrc}
                alt={illustrationAlt}
                style={{ width: "100%", maxWidth: 360, objectFit: "contain" }}
              />
            </IllustrationCol>
          </CardGrid>
        </Card>
      </AuthContainer>
    </AuthShell>
  );
};

export default AuthLayout;
