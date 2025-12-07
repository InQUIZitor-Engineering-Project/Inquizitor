import React from "react";
import { useTheme } from "styled-components";
import { Box, Flex } from "../../../design-system/primitives";
import { NAVBAR_HEIGHT } from "../../../components/Navbar/Navbar.styles";

interface AuthLayoutProps {
  left: React.ReactNode;
  illustrationSrc: string;
  illustrationAlt: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ left, illustrationSrc, illustrationAlt }) => {
  const theme = useTheme();

  return (
    <Flex
      $direction="column"
      $bg={theme.colors.tint.t4}
      style={{
        minHeight: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
        height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <Flex
        $flex={1}
        $align="center"
        $justify="center"
        $p="xl"
        style={{ width: "100%", height: "100%", overflow: "hidden", boxSizing: "border-box" }}
      >
        <Box
          $bg="#fff"
          $radius="xl"
          $shadow="md"
          $p="xl"
          style={{ width: "100%", maxWidth: 960 }}
        >
          <Flex $gap="xl" $wrap="wrap" style={{ alignItems: "center" }}>
            <Box style={{ flex: "1 1 360px", minWidth: 320 }}>{left}</Box>

            <Flex $justify="center" $align="center" style={{ flex: "1 1 280px", minWidth: 260 }}>
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
    </Flex>
  );
};

export default AuthLayout;
