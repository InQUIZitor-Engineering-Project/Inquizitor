import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getMyTests } from "../../services/test";
import { Box, Flex, Stack, Heading, Text, Button } from "../../design-system/primitives";
import { useLoader } from "../Loader/GlobalLoader";
import heroImg from "../../assets/landing_main.png";
import styled from "styled-components";
import { NAVBAR_HEIGHT } from "../Navbar/Navbar.styles";

const HeroSection = styled(Box)`
  min-height: auto;
  padding: 32px 0;

  @media (max-width: 1000px) and (min-width: 901px) {
    padding: 16px 16px 20px;
  }

  ${({ theme }) => theme.media.down("md")} {
    padding: 32px 16px 24px;
  }

  ${({ theme }) => theme.media.down("sm")} {
    min-height: calc(100vh - ${NAVBAR_HEIGHT}px);
  }
`;

const HeroLayout = styled(Flex)`
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 0;

  @media (max-width: 1000px) and (min-width: 901px) {
    flex-direction: column-reverse; /* obrazek na górze w 900-1000 */
    text-align: center;
    align-items: center;
    gap: 12px;
    justify-content: center;
  }

  ${({ theme }) => theme.media.down("md")} {
    flex-direction: column-reverse; /* obrazek na górze */
    text-align: center;
    align-items: center;
    gap: 12px;
    justify-content: center;
  }
`;

const HeroContent = styled(Stack)`
  flex: 0 1 620px;
  max-width: 620px;
  width: 100%;
  min-width: 0;
  gap: 12px;

  @media (max-width: 1200px) {
    flex: 0 1 460px;
    max-width: 460px;
  }

  @media (max-width: 1000px) and (min-width: 901px) {
    flex: 0 1 380px;
    max-width: 380px;
    gap: 10px;
  }

  ${({ theme }) => theme.media.down("md")} {
    flex: 1 1 auto;
    max-width: 100%;
    gap: 8px;
  }
`;

const HeroImage = styled(Box)`
  width: 100%;
  max-width: 520px;

  @media (max-width: 1000px) and (min-width: 901px) {
    max-width: 320px;
    max-height: 320px;
  }

  ${({ theme }) => theme.media.down("md")} {
    max-width: 340px;
    max-height: 320px;
  }

  ${({ theme }) => theme.media.down("sm")} {
    max-width: 280px;
    max-height: 280px;
  }
`;

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
    <HeroSection $bg="#f5f6f8" $display="flex" style={{ alignItems: "center" }}>
      <HeroLayout $align="center" $justify="space-between" $wrap="wrap">
        <HeroContent>
          <Heading $level="h1" as="h1" style={{ fontSize: "clamp(28px, 5.5vw, 40px)", lineHeight: "1.2" }}>
            Stwórz quiz w mgnieniu oka
          </Heading>
          <Text $variant="body1" $tone="muted" style={{ maxWidth: "100%" }}>
            Inteligentna platforma do tworzenia quizów z treści książek i dokumentów.
          </Text>
          <Box $mt="sm">
            <Button $variant="primary" $size="lg" onClick={handleStart}>
              {buttonText}
            </Button>
          </Box>
        </HeroContent>

        <Flex $justify="center" style={{ flex: "1 1 400px", minWidth: 280 }}>
          <HeroImage
            as="img"
            src={heroImg}
            alt="Hero Illustration"
            style={{ width: "100%", maxWidth: 520, objectFit: "contain" }}
          />
        </Flex>
      </HeroLayout>
    </HeroSection>
  );
};

export default Hero;
