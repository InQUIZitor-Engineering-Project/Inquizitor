import React, { type ReactNode } from "react";
import { useTheme } from "styled-components";
import { Box, Flex, Heading, Stack, Text } from "../../design-system/primitives";
import onasImg from "../../assets/onas_new2.webp";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { PageContainer, PageSection } from "../../design-system/patterns";
import styled from "styled-components";

const AboutGrid = styled(Box)`
  display: grid;
  align-items: center;
  grid-template-columns: 1fr;
  grid-template-areas:
    "title"
    "image"
    "stats";
  gap: 24px;

  ${({ theme }) => theme.media.up("md")} {
    grid-template-columns: 1fr 1fr;
    grid-template-areas:
      "title image"
      "stats image";
    grid-template-rows: min-content min-content;
    column-gap: 32px; 
    row-gap: 16px; /* Mały odstęp między Tytułem a Statystykami */
  }
`;

const TitleSection = styled(Stack)`
  grid-area: title;
  
  ${({ theme }) => theme.media.up("md")} {
    padding-left: 48px;
    align-self: end;
  }
`;

const StatsSection = styled(Flex)`
  grid-area: stats;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};

  ${({ theme }) => theme.media.up("md")} {
    padding-left: 48px;
    align-self: start;
  }
`;

const ImageSection = styled(Flex)`
  grid-area: image;
  justify-content: center;
  align-items: center;

  img {
    max-width: 100%;
    height: auto;
    display: block;
    max-height: 500px; 
  }
`;

const AboutUsPage: React.FC = () => {
  const theme = useTheme();
  useDocumentTitle("O nas | Inquizitor");

  const Stat = ({ value, label }: { value: ReactNode; label: string }) => (
    <Flex
      $direction="column"
      $align="center"
      $justify="center"
      $bg={theme.colors.tint.t5}
      $border="1px solid rgba(76, 175, 80, 0.12)"
      $radius="xl"
      $p="md"
      $shadow="md"
      style={{ minWidth: 110, flex: 1, textAlign: "center" }}
    >
      <Text $variant="body1" $weight="medium" style={{ color: theme.colors.brand.primary }}>
        {value}
      </Text>
      <Text $variant="body3" $tone="muted">
        {label}
      </Text>
    </Flex>
  );

  return (
    <Flex
      $direction="column"
      $bg={theme.colors.neutral.silver}
      style={{ minHeight: "100%" }}
    >
      <Flex $flex={1} $width="100%" $justify="center" $overflow="hidden">
        <PageSection $py="lg">
          <PageContainer>
            <Stack $gap="lg" style={{ width: "100%" }}>
              
              <AboutGrid
                $p="lg"
                $radius="xl"
                $bg="#fff"
                $shadow="md"
              >
                <TitleSection $gap="md">
                  <Heading $level="h2" as="h2">
                    <Box as="span" style={{ color: theme.colors.brand.primary }}>
                      Inquizitor
                    </Box>{" "}
                    powstaje, aby ułatwić tworzenie nowoczesnych testów.
                  </Heading>
                </TitleSection>

                <ImageSection>
                  <Box
                    as="img"
                    src={onasImg}
                    alt="Zespół Inquizitor"

                  />
                </ImageSection>

                <StatsSection>
                  <Stat value={3} label="osoby w zespole" />
                  <Stat value="AI" label="w sercu aplikacji" />
                  <Stat value="&infin;" label="możliwości testów" />
                </StatsSection>
              </AboutGrid>

              <Box $p="lg" $radius="xl" $bg="#fff" $shadow="md">
                <Stack $gap="sm">
                  <Heading $level="h3" as="h3">
                    Kim jesteśmy?
                  </Heading>
                  <Text>
                  Inquizitor to projekt stworzony przez <strong>trójkę studentów z Krakowa</strong>, którzy połączyli pasję do technologii z realnymi potrzebami edukacji. Zamiast kolejnego prostego generatora pytań, stworzyliśmy <strong>inteligentne narzędzie</strong>, które faktycznie rozumie materiał i pomaga nauczycielom tworzyć wartościowe testy szybciej i wygodniej.
                  </Text>
                  <Text>
                    <strong>Inquizitor:</strong>
                  </Text>
                  <Box as="ul" style={{ margin: 0, paddingLeft: 18, listStyle: "disc" }}>
                    <li>
                      <Text as="span">rozumie materiał źródłowy, a nie tylko wycina losowe zdania,</Text>
                    </li>
                    <li>
                      <Text as="span">pozwala łatwo edytować pytania i odpowiedzi,</Text>
                    </li>
                    <li>
                      <Text as="span">umożliwia eksport do PDF i XML,</Text>
                    </li>
                    <li>
                      <Text as="span">pracuje wygodnie również przy większej liczbie testów.</Text>
                    </li>
                  </Box>
                  <Text>
                    To narzędzie stworzone z myślą o realnej pracy nauczyciela.
                  </Text>
                </Stack>
              </Box>

              <Box $p="lg" $radius="xl" $bg="#fff" $shadow="md">
                <Stack $gap="sm">
                  <Heading $level="h3" as="h3">
                    Dokąd zmierzamy?
                  </Heading>
                  <Text>
                    Naszą wizją jest <strong>kompletna platforma edukacyjna</strong>, która wspiera nauczycieli i uczniów na każdym etapie nauki. Chcemy, aby Inquizitor był nie tylko generatorem testów, ale <strong>centrum zarządzania materiałami dydaktycznymi</strong>.
                  </Text>
                  <Text>
                    <strong>Planujemy m.in.:</strong>
                  </Text>
                  <Box as="ul" style={{ margin: 0, paddingLeft: 18, listStyle: "disc" }}>
                    <li>
                      <Text as="span">funkcje wspierające <strong>neuroróżnorodnych uczniów</strong>,</Text>
                    </li>
                    <li>
                      <Text as="span">rozbudowany <strong>moduł zarządzania materiałami edukacyjnymi</strong>,</Text>
                    </li>
                    <li>
                      <Text as="span"><strong>personalizację nauki</strong> pod potrzeby klasy i pojedynczego ucznia,</Text>
                    </li>
                    <li>
                      <Text as="span">narzędzia do <strong>analizy postępów i wyników</strong>.</Text>
                    </li>
                  </Box>
                  <Text>
                    Tworzymy Inquizitora jako <strong>nowoczesne narzędzie edukacyjne</strong> na miarę XXI wieku.
                  </Text>
                </Stack>
              </Box>

            </Stack>
          </PageContainer>
        </PageSection>
      </Flex>
    </Flex>
  );
};

export default AboutUsPage;
