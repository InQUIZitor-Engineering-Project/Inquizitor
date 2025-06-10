import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getMyTests } from "../../services/test";
import {
  HeroSection,
  ContentWrapper,
  TextContent,
  Title,
  Subtitle,
  PrimaryButtonWrapper,
  ImageWrapper,
  Illustration,
} from "./Hero.styles";
import Button from "../Button/Button";

const Hero: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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
    ? "Przejdź do dashboardu"
    : "Utwórz pierwszy test";

  const handleStart = () => {
    if (!user) {
      navigate('/login');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <HeroSection>
      <ContentWrapper>
        <TextContent>
          <Title>Stwórz własny quiz w mgnieniu oka</Title>
          <Subtitle>
            Inteligentna platforma do tworzenia quizów z treści książek i dokumentów.
          </Subtitle>
          <PrimaryButtonWrapper>
            <Button variant="primary" onClick={handleStart}>
              {buttonText}
            </Button>
          </PrimaryButtonWrapper>
        </TextContent>
        <ImageWrapper>
          <Illustration
            src="/src/assets/landing_main.png"
            alt="Hero Illustration"
          />
        </ImageWrapper>
      </ContentWrapper>
    </HeroSection>
  );
};

export default Hero;
