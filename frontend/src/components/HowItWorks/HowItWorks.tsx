import React from "react";
import { Box, Stack, Heading, Text, Flex } from "../../design-system/primitives";
import StepCard from "./StepCard";

interface HowItWorksProps {
  id?: string;
}

const HowItWorks: React.FC<HowItWorksProps> = ({ id }) => {
  return (
    <Box
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

      <Flex
        $gap="lg"
        $wrap="wrap"
        style={{ width: "100%", maxWidth: 1200, justifyContent: "center" }}
      >
        <StepCard
          iconSrc="/src/assets/icons/upload.png"
          title="Prześlij plik"
          description="Wgraj swoje materiały w jednym z obsługiwanych formatów, np. PDF lub JPG"
        />
        <StepCard
          iconSrc="/src/assets/icons/quiz.png"
          title="Generuj quiz"
          description="Sztuczna inteligencja przetworzy materiały i wygeneruje zadania – w pełni dopasowane do Twoich potrzeb"
        />
        <StepCard
          iconSrc="/src/assets/icons/share.png"
          title="Udostępnij"
          description="Gotowy quiz możesz z łatwością pobrać i wykorzystać na swojej lekcji"
        />
      </Flex>
    </Box>
  );
};

export default HowItWorks;