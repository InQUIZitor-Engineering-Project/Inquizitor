import React from "react";
import { Box, Stack, Heading, Text, Flex } from "../../design-system/primitives";
import StepCard from "./StepCard";
import uploadIcon from "../../assets/icons/upload.png";
import quizIcon from "../../assets/icons/quiz.png";
import shareIcon from "../../assets/icons/share.png";
import styled from "styled-components";

const HowItWorksSection = styled(Box)`
  /* Większy górny margines dla sekcji na desktopie i tabletach */
  padding-top: 96px;

  ${({ theme }) => theme.media.down("md")} {
    padding: 56px 16px;
    padding-top: 72px;
  }
`;

const StepsRow = styled(Flex)`
  ${({ theme }) => theme.media.down("md")} {
    gap: 16px;
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
      $px="lg"
      $display="flex"
      $flex={1}
      style={{ flexDirection: "column", alignItems: "center", minHeight: "50vh", justifyContent: "center" }}
    >
      <Stack $gap="xs" $align="center" style={{ textAlign: "center", marginBottom: 32 }}>
        <Heading $level="h2">Jak to działa?</Heading>
        <Text $variant="body2" $tone="muted">
          Tworzenie quizu krok po kroku
        </Text>
      </Stack>

      <StepsRow
        $gap="lg"
        $wrap="wrap"
        style={{ width: "100%", maxWidth: 1200, justifyContent: "center" }}
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
      </StepsRow>
    </HowItWorksSection>
  );
};

export default HowItWorks;