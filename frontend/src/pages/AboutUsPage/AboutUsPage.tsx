import React, { type ReactNode } from "react";
import { useTheme } from "styled-components";
import { Box, Flex, Heading, Stack, Text } from "../../design-system/primitives";
import styled from "styled-components";
import Footer from "../../components/Footer/Footer";
import onasImg from "../../assets/onas_nobackground2.png";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { PageContainer } from "../../styles/common";

const AboutGrid = styled(Box)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  align-items: center;
  gap: 32px;

  ${({ theme }) => theme.media.down("md")} {
    grid-template-columns: 1fr;
    justify-items: center;
    gap: 24px;
  }
`;

const AboutUsPage: React.FC = () => {
  const theme = useTheme();
  useDocumentTitle("O nas | Inquizitor");

  const Stat = ({ value, label }: { value: ReactNode; label: string }) => (
    <Box
      $bg="#fff"
      $border="1px solid rgba(76, 175, 80, 0.12)"
      $radius="xl"
      $p="md"
      $shadow="md"
      $flex="1"
      style={{ minWidth: 110 }}
    >
      <Text $variant="body1" $weight="medium" style={{ color: theme.colors.brand.primary }}>
        {value}
      </Text>
      <Text $variant="body3" $tone="muted">
        {label}
      </Text>
    </Box>
  );

  return (
    <Flex
      $direction="column"
      $bg={theme.colors.neutral.silver}
      style={{ minHeight: "calc(100vh - 40px)" }}
    >
      <Flex $flex={1} $width="100%" $justify="center" $overflow="hidden">
        <PageContainer as={Stack} $gap="lg">
          <AboutGrid $p="lg" $radius="xl" $bg="#fff" $shadow="md">
            <Stack $gap="md">
              <Heading $level="h2" as="h2">
                <Box as="span" style={{ color: theme.colors.brand.primary }}>
                  Inquizitor
                </Box>{" "}
                powstaje, aby ułatwić tworzenie nowoczesnych testów.
              </Heading>

              <Flex $wrap="wrap" $gap="sm">
                <Stat value={3} label="osoby w zespole" />
                <Stat value="AI" label="w sercu aplikacji" />
                <Stat value="∞" label="możliwości testów" />
              </Flex>
            </Stack>

            <Flex $justify="center">
              <Box
                as="img"
                src={onasImg}
                alt="Zespół Inquizitor"
                style={{ maxWidth: "100%", height: "auto", display: "block" }}
              />
            </Flex>
          </AboutGrid>

          <Box $p="lg" $radius="xl" $bg="#fff" $shadow="md">
            <Stack $gap="sm">
              <Heading $level="h3" as="h3">
                Kim jesteśmy?
              </Heading>
              <Text>
                Inquizitor powstał jako projekt inżynierski trójki studentów z Krakowa,
                którzy na co dzień obserwowali, ile czasu zajmuje tworzenie rzetelnych
                testów i kartkówek. Zamiast kolejnego „generatora pytań”, chcieliśmy
                zbudować narzędzie, które:
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
            </Stack>
          </Box>

          <Box $p="lg" $radius="xl" $bg="#fff" $shadow="md">
            <Stack $gap="sm">
              <Heading $level="h3" as="h3">
                Dokąd zmierzamy?
              </Heading>
              <Text>
                Naszym celem jest stworzenie kompletnej platformy do przygotowywania testów:
                z automatycznym generowaniem tytułów, statystykami profilu, rozbudowanym
                panelem użytkownika oraz łatwym wdrożeniem w szkołach, firmach i na uczelniach.
              </Text>
            </Stack>
          </Box>

          <Footer />
        </PageContainer>
      </Flex>
    </Flex>
  );
};

export default AboutUsPage;
