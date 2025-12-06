import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getMyTests } from "../../services/test";
import { Box, Flex, Stack, Heading, Text, Button } from "../../design-system/primitives";
import { useLoader } from "../Loader/GlobalLoader";

const Hero: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { withLoader } = useLoader();
  const [hasTests, setHasTests] = useState(false);

  useEffect(() => {
    if (user) {
      getMyTests()
        .then((data) => setHasTests(data.length > 0))
        .catch(console.error);
    }
  }, [user]);

  const buttonText = !user
    ? "Rozpocznij za darmo"
    : hasTests
    ? "Przejdź dalej"
    : "Utwórz pierwszy test";

  const handleStart = () => {
    withLoader(async () => {
      if (!user) {
        navigate("/login");
      } else {
        navigate("/dashboard");
      }
      await new Promise((res) => setTimeout(res, 250));
    });
  };

  return (
    <Box
      $bg="#f5f6f8"
      $py="xxl"
      $px="lg"
      $display="flex"
      style={{ minHeight: "50vh", alignItems: "center" }}
    >
      <Flex
        $align="center"
        $justify="space-between"
        $wrap="wrap"
        style={{ gap: 32, maxWidth: 1200, margin: "0 auto", padding: "0 16px" }}
      >
        <Stack $gap="md" style={{ flex: "1 1 500px", minWidth: 320 }}>
          <Heading $level="h1" as="h1">
            Stwórz quiz w mgnieniu oka
          </Heading>
          <Text $variant="body1" $tone="muted" style={{ maxWidth: 520 }}>
            Inteligentna platforma do tworzenia quizów z treści książek i dokumentów.
          </Text>
          <Box $mt="sm">
            <Button $variant="primary" $size="lg" onClick={handleStart}>
              {buttonText}
            </Button>
          </Box>
        </Stack>

        <Flex $justify="center" style={{ flex: "1 1 400px", minWidth: 280 }}>
          <Box
            as="img"
            src="/src/assets/landing_main.png"
            alt="Hero Illustration"
            style={{ width: "100%", maxWidth: 520, objectFit: "contain" }}
          />
        </Flex>
      </Flex>
    </Box>
  );
};

export default Hero;
