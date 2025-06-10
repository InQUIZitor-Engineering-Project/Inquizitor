import React from "react";
import {
  SectionWrapper,
  SectionHeader,
  SectionSubheader,
  CardsGrid,
} from "./HowItWorks.styles";
import StepCard from "./StepCard";

const HowItWorks: React.FC = () => {
  return (
    <SectionWrapper>
      <SectionHeader>Jak to działa?</SectionHeader>
      <SectionSubheader>Tworzenie quizu krok po kroku</SectionSubheader>
      <CardsGrid>
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
      </CardsGrid>
    </SectionWrapper>
  );
};

export default HowItWorks;
