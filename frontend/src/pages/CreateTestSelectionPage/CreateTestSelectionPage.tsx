import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { Box, Flex, Stack, Heading, Text, Button } from "../../design-system/primitives";
import { PageContainer, PageSection } from "../../design-system/patterns";
import quizIcon from "../../assets/icons/quiz.webp";
import uploadIcon from "../../assets/icons/upload.webp";

const SelectionCard = styled(Box)<{ $selected: boolean }>`
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  border: 2px solid ${({ theme, $selected }) => ($selected ? theme.colors.brand.primary : "transparent")};
  background: ${({ theme }) => theme.colors.neutral.white};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: ${({ theme }) => theme.spacing.xl};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  flex: 1;
  min-width: 280px;
  max-width: 400px;
  min-height: 200px;
  box-shadow: ${({ theme }) => theme.elevation.md};

  &:hover {
    transform: translateY(-4px);
    box-shadow: ${({ theme }) => theme.elevation.lg};
    border-color: ${({ theme, $selected }) => ($selected ? theme.colors.brand.primary : theme.colors.tint.t3)};
  }

  h3 {
    font-size: 20px;
    margin-bottom: ${({ theme }) => theme.spacing.xs};
  }

  p {
    font-size: 14px;
    line-height: 1.5;
  }

  ${({ theme }) => theme.media.down("sm")} {
    padding: ${({ theme }) => theme.spacing.md};
    min-width: 0;
    width: 100%;
    max-width: 100%;
    height: 25dvh;
    min-height: 160px;
    flex: none;
    flex-direction: column;
    text-align: center;
    align-items: center;
    gap: ${({ theme }) => theme.spacing.xs};

    h3 {
      font-size: 16px;
      margin-bottom: 0;
    }

    p {
      font-size: 12px;
      line-height: 1.4;
    }
  }
`;

const IconWrapper = styled.div`
  width: 80px;
  height: 80px;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.neutral.silver};
  border-radius: ${({ theme }) => theme.radii.full};
  flex-shrink: 0;

  img {
    width: 40px;
    height: 40px;
    object-fit: contain;
  }

  ${({ theme }) => theme.media.down("sm")} {
    width: 8dvh;
    height: 8dvh;
    min-width: 48px;
    min-height: 48px;
    margin-bottom: 0;

    img {
      width: 4dvh;
      height: 4dvh;
      min-width: 24px;
      min-height: 24px;
    }
  }
`;

const ResponsivePageSection = styled(PageSection)`
  padding-top: ${({ theme }) => theme.spacing["3xl"]};
  padding-bottom: ${({ theme }) => theme.spacing["3xl"]};
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;

  ${({ theme }) => theme.media.down("md")} {
    padding-top: ${({ theme }) => theme.spacing.xl};
    padding-bottom: ${({ theme }) => theme.spacing.xl};
  }

  ${({ theme }) => theme.media.down("sm")} {
    padding-top: 0;
    padding-bottom: 0;
    /* dynamic viewport height fallback */
    height: 100%;
    overflow: hidden;
  }
`;

const ContentStack = styled(Stack)`
  width: 100%;
  
  ${({ theme }) => theme.media.down("sm")} {
    gap: ${({ theme }) => theme.spacing.lg};
    padding-bottom: env(safe-area-inset-bottom);
  }
`;

const CardsContainer = styled(Flex)`
  width: 100%;
  max-width: 900px;
  
  ${({ theme }) => theme.media.down("sm")} {
    flex-direction: column;
    align-items: center;
    flex-wrap: nowrap;
    gap: ${({ theme }) => theme.spacing.md};
  }
`;

const CreateTestSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<'ai' | 'manual' | null>(null);

  const handleContinue = () => {
    if (selectedType === 'ai') {
      navigate('/tests/new/ai');
    } else if (selectedType === 'manual') {
      navigate('/tests/new/manual');
    }
  };

  return (
    <Flex $direction="column" $bg="#f5f6f8" style={{ height: "100%", overflow: "hidden" }}>
      <Box $flex={1} $width="100%" style={{ height: "100%" }}>
        <ResponsivePageSection>
          <PageContainer style={{ height: "100%", display: "flex", alignItems: "center" }}>
            <ContentStack $gap="2xl" $align="center">
              <Stack $gap="xs" $align="center">
                <Heading as="h1" $level="h2" style={{ textAlign: "center", fontSize: "clamp(20px, 5vw, 32px)" }}>
                  Zacznij tworzyć swój test
                </Heading>
                <Text $variant="body2" $tone="muted" style={{ textAlign: "center", fontSize: "clamp(13px, 3.5vw, 15px)" }}>
                  Wybierz jedną z dostępnych metod, aby przejść dalej.
                </Text>
              </Stack>

              <CardsContainer 
                $gap="md" 
                $justify="center" 
                $wrap="wrap"
              >
                <SelectionCard 
                  $selected={selectedType === 'ai'} 
                  onClick={() => setSelectedType('ai')}
                >
                  <IconWrapper>
                    <img src={uploadIcon} alt="AI" />
                  </IconWrapper>
                  <Stack $gap="xs" $align="center">
                    <Heading as="h3" $level="h4">Przez AI</Heading>
                    <Text $variant="body3" $tone="muted">
                      Wgraj materiały (PDF, obraz, tekst), a nasza sztuczna inteligencja przygotuje propozycje pytań za Ciebie.
                    </Text>
                  </Stack>
                </SelectionCard>

                <SelectionCard 
                  $selected={selectedType === 'manual'} 
                  onClick={() => setSelectedType('manual')}
                >
                  <IconWrapper>
                    <img src={quizIcon} alt="Manual" />
                  </IconWrapper>
                  <Stack $gap="xs" $align="center">
                    <Heading as="h3" $level="h4">Od zera</Heading>
                    <Text $variant="body3" $tone="muted">
                      Stwórz test ręcznie, dodając każde pytanie po kolei. Masz pełną kontrolę nad treścią i strukturą.
                    </Text>
                  </Stack>
                </SelectionCard>
              </CardsContainer>

              <Button 
                $size="lg" 
                disabled={!selectedType} 
                onClick={handleContinue}
                style={{ width: "200px" }}
              >
                Kontynuuj
              </Button>
            </ContentStack>
          </PageContainer>
        </ResponsivePageSection>
      </Box>
    </Flex>
  );
};

export default CreateTestSelectionPage;
