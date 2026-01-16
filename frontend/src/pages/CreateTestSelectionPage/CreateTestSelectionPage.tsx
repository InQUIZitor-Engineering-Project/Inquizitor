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
  text-align: center;
  flex: 1;
  min-width: 280px;
  max-width: 400px;
  box-shadow: ${({ theme }) => theme.elevation.md};

  &:hover {
    transform: translateY(-4px);
    box-shadow: ${({ theme }) => theme.elevation.lg};
    border-color: ${({ theme, $selected }) => ($selected ? theme.colors.brand.primary : theme.colors.tint.t3)};
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

  img {
    width: 40px;
    height: 40px;
    object-fit: contain;
  }
`;

const ResponsivePageSection = styled(PageSection)`
  padding-top: ${({ theme }) => theme.spacing["3xl"]};
  padding-bottom: ${({ theme }) => theme.spacing["3xl"]};

  ${({ theme }) => theme.media.down("md")} {
    padding-top: ${({ theme }) => theme.spacing.xl};
    padding-bottom: ${({ theme }) => theme.spacing.xl};
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
    <Flex $direction="column" $height="100%" $bg="#f5f6f8">
      <Box $flex={1} $width="100%">
        <ResponsivePageSection>
          <PageContainer>
            <Stack $gap="2xl" $align="center" style={{ width: "100%" }}>
              <Stack $gap="xs" $align="center">
                <Heading as="h1" $level="h2" style={{ textAlign: "center" }}>Zacznij tworzyć swój test</Heading>
                <Text $variant="body2" $tone="muted" style={{ textAlign: "center" }}>Wybierz jedną z dostępnych metod, aby przejść dalej.</Text>
              </Stack>

              <Flex $gap="lg" $justify="center" $wrap="wrap" style={{ width: "100%", maxWidth: 900 }}>
                <SelectionCard 
                  $selected={selectedType === 'ai'} 
                  onClick={() => setSelectedType('ai')}
                >
                  <IconWrapper>
                    <img src={uploadIcon} alt="AI" />
                  </IconWrapper>
                  <Stack $gap="sm">
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
                  <Stack $gap="sm">
                    <Heading as="h3" $level="h4">Od zera</Heading>
                    <Text $variant="body3" $tone="muted">
                      Stwórz test ręcznie, dodając każde pytanie po kolei. Masz pełną kontrolę nad treścią i strukturą.
                    </Text>
                  </Stack>
                </SelectionCard>
              </Flex>

              <Button 
                $size="lg" 
                disabled={!selectedType} 
                onClick={handleContinue}
                style={{ width: "200px" }}
              >
                Kontynuuj
              </Button>
            </Stack>
          </PageContainer>
        </ResponsivePageSection>
      </Box>
    </Flex>
  );
};

export default CreateTestSelectionPage;
