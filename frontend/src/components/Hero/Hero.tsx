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
    <HeroSection>
      <ContentWrapper>
        <TextContent>
          <Title>Stwórz quiz w mgnieniu oka</Title>
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
