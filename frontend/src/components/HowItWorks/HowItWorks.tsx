import React from "react";
import styled from "styled-components";
import { Box, Stack, Heading, Text, Flex } from "../../design-system/primitives";
import StepCard from "./StepCard";
import uploadIcon from "../../assets/icons/upload.png";
import quizIcon from "../../assets/icons/quiz.png";
import shareIcon from "../../assets/icons/share.png";
import { PageContainer } from "../../design-system/patterns";

const HowItWorksSection = styled(Box)`
  ${({ theme }) => theme.media.down("lg")} {
    padding-top: calc(${({ theme }) => theme.spacing["xl"]} + ${({ theme }) => theme.spacing.xl});
  }
`;

interface HowItWorksProps {
  id?: string;
}

const HowItWorks: React.FC<HowItWorksProps> = ({ id }) => {
  return (
    <HowItWorksSection
      id={id}
      $bg="#ffffff"
      $py="xxl"
      $display="flex"
      $flex={1}
      style={{ flexDirection: "column", alignItems: "center", minHeight: "50vh", justifyContent: "center" }}
    >
      <PageContainer>
        <Stack $gap="xs" $align="center" style={{ textAlign: "center", marginBottom: 32 }}>
          <Heading $level="h2">Jak to działa?</Heading>
          <Text $variant="body2" $tone="muted">
            Tworzenie quizu krok po kroku
          </Text>
        </Stack>

        <Flex
          $gap="lg"
          $wrap="wrap"
          style={{ width: "100%", justifyContent: "center" }}
        >
          <StepCard
            iconSrc={uploadIcon}
            title="Prześlij plik"
            description="Wgraj swoje materiały w jednym z obsługiwanych formatów, np. PDF lub JPG"
          />
          <StepCard
            iconSrc={quizIcon}
            title="Generuj quiz"
            description="Sztuczna inteligencja przetworzy materiały i wygeneruje zadania – w pełni dopasowane do Twoich potrzeb"
          />
          <StepCard
            iconSrc={shareIcon}
            title="Udostępnij"
            description="Gotowy quiz możesz z łatwością pobrać i wykorzystać na swojej lekcji"
          />
        </Flex>
      </PageContainer>
    </HowItWorksSection>
  );
};

export default HowItWorks;