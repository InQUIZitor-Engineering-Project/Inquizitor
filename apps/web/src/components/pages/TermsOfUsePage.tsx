"use client";
import React from "react";
import { useTheme } from "styled-components";
import {
  Box,
  Flex,
  Heading,
  Stack,
  Text,
  PageContainer,
  PageSection,
} from "@inquizitor/ui";
import styled, { type DefaultTheme } from "styled-components";

const SectionHeading = styled(Heading)`
  margin-top: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing.sm};

  &:first-of-type {
    margin-top: 0;
  }
`;

const SectionText = styled(Text)`
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const TermsOfUsePage: React.FC = () => {
  const theme = useTheme() as DefaultTheme;

  return (
    <Flex $direction="column" $bg="transparent" style={{ minHeight: "100%" }}>
      <Flex $flex={1} $width="100%" $justify="center">
        <PageSection $py="lg">
          <PageContainer>
            <Box
              $p="xl"
              $radius="xl"
              $bg={theme.colors.neutral.white}
              $shadow="md"
              style={{ maxWidth: 960, margin: "0 auto" }}
            >
              <Stack $gap="sm">
                <Heading $level="h2" as="h1">
                  Warunki korzystania
                </Heading>
                <Text $variant="body2" $tone="muted">
                  Ostatnia aktualizacja: 25.04.2026
                </Text>
              </Stack>

              <SectionText style={{ marginTop: "16px" }}>
                Niniejsze Warunki korzystania okreslaja zasady uzywania aplikacji
                Inquizitor, w tym zasady zwiazane z wykorzystaniem funkcji opartych
                o AI.
              </SectionText>

              <SectionHeading $level="h3" as="h2">
                §1. Prawa wlasnosci intelektualnej
              </SectionHeading>
              <SectionText>
                Uzytkownik oswiadcza, ze jest wlascicielem praw autorskich do
                przesylanych materialow edukacyjnych (tekstow, plikow, grafik) lub
                posiada odpowiednia licencje albo zgode na ich wykorzystanie.
              </SectionText>
              <SectionText>
                Korzystajac z aplikacji, Uzytkownik udziela operatorowi ograniczonej,
                niewylacznej i nieodplatnej licencji na wykorzystanie przeslanych
                tresci wylacznie w zakresie niezbednym do realizacji uslugi.
              </SectionText>

              <SectionHeading $level="h3" as="h2">
                §2. Zasady korzystania z AI
              </SectionHeading>
              <SectionText>
                W celu wygenerowania pytan testowych tresci przeslanych materialow sa
                przekazywane do zewnetrznego dostawcy technologii AI (Google LLC,
                Gemini API).
              </SectionText>
              <SectionText>
                Przekazanie danych jest technicznie niezbedne do wykonania uslugi.
                Przetwarzanie odbywa sie zgodnie z politykami bezpieczenstwa i
                prywatnosci dostawcy technologii.
              </SectionText>

              <SectionHeading $level="h3" as="h2">
                §3. Odpowiedzialnosc uzytkownika
              </SectionHeading>
              <SectionText>
                Uzytkownik ponosi wylaczna odpowiedzialnosc za tresc przesylanych
                materialow. Zabrania sie przesylania tresci naruszajacych prawa osob
                trzecich, poufnych danych osobowych lub tresci niezgodnych z prawem.
              </SectionText>

              <SectionHeading $level="h3" as="h2">
                §4. Ograniczenie odpowiedzialnosci
              </SectionHeading>
              <SectionText style={{ marginBottom: 0 }}>
                Tresci i testy tworzone sa automatycznie przez modele jezykowe.
                Uzytkownik powinien kazdorazowo zweryfikowac wygenerowane materialy
                przed wykorzystaniem ich w praktyce.
              </SectionText>
            </Box>
          </PageContainer>
        </PageSection>
      </Flex>
    </Flex>
  );
};

export default TermsOfUsePage;
