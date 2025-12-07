import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getMyTests } from "../../services/test";
import { Box, Flex, Stack, Heading, Text, Button } from "../../design-system/primitives";
import { useLoader } from "../Loader/GlobalLoader";
import heroImg from "../../assets/landing_main.png";
import { PageContainer } from "../../design-system/patterns";
import { NAVBAR_HEIGHT } from "../Navbar/Navbar.styles";

const HeroSection = styled(Box)`
  min-height: 50vh;
  display: flex;
  align-items: center;

  ${({ theme }) => theme.media.down("md")} {
    min-height: calc(90vh - ${NAVBAR_HEIGHT}px);
  }
`;

const HeroGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 32px;
  align-items: center;

  ${({ theme }) => theme.media.down("md")} {
    grid-template-columns: 1fr;
    gap: 24px;
    text-align: center;
  }
`;

const HeroText = styled(Stack)`
  width: 100%;
  justify-self: start;

  ${({ theme }) => theme.media.down("md")} {
    justify-self: center;
    align-items: center;
  }
`;

const HeroImage = styled(Flex)`
  justify-content: center;

  ${({ theme }) => theme.media.down("md")} {
    order: -1;
  }

  ${({ theme }) => theme.media.up("md")} {
    order: 2;
    justify-self: end;
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
    <HeroSection $bg="#f5f6f8" $py="xxl">
      <PageContainer>
        <HeroGrid>
          <HeroImage>
            <Box
              as="img"
              src={heroImg}
              alt="Hero Illustration"
              style={{ width: "100%", maxWidth: 520, objectFit: "contain" }}
            />
          </HeroImage>

          <HeroText $gap="md">
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
          </HeroText>
        </HeroGrid>
      </PageContainer>
    </HeroSection>
  );
};

export default Hero;
