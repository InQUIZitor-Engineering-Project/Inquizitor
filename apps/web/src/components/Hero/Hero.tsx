"use client";
import React from "react";
import styled from "styled-components";
import { Box, Flex, Stack, Heading, Text, Button, PageContainer } from "@inquizitor/ui";
import { NAVBAR_HEIGHT } from "@/components/Navbar/Navbar.styles";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:5173";

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
    margin-bottom: -40px;
  }

  ${({ theme }) => theme.media.up("md")} {
    order: 2;
    justify-self: end;
    transform: scale(1.15) translateY(40px);
  }
`;

const Hero: React.FC = () => {
  return (
    <HeroSection $bg="transparent" $py="xxl">
      <PageContainer>
        <HeroGrid>
          <HeroImage>
            <Box
              as="img"
              src="/main1.webp"
              alt="Ilustracja główna Inquizitor - tworzenie quizów"
              style={{ width: "100%", maxWidth: "100%", objectFit: "contain" }}
            />
          </HeroImage>

          <HeroText $gap="md">
            <Heading $level="h1" as="h1">
              Stwórz quiz w mgnieniu oka
            </Heading>
            <Text $variant="body1" $tone="muted" style={{ maxWidth: 520 }}>
              Inteligentna platforma do tworzenia quizów z treści książek i
              dokumentów.
            </Text>
            <Box $mt="sm">
              <Button
                $variant="primary"
                $size="lg"
                as="a"
                href={`${APP_URL}/login`}
              >
                Rozpocznij za darmo
              </Button>
            </Box>
          </HeroText>
        </HeroGrid>
      </PageContainer>
    </HeroSection>
  );
};

export default Hero;
