import React from "react";
import { useTheme } from "styled-components";
import { Box, Flex, Heading, Stack, Text } from "../../design-system/primitives";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { PageContainer, PageSection } from "../../design-system/patterns";
import styled, { type DefaultTheme } from "styled-components";

const SectionHeading = styled(Heading)`
  margin-top: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing.sm};

  &:first-of-type {
    margin-top: 0;
  }
`;

const SubHeading = styled(Heading)`
  margin-top: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.typography.body.regular.body1.fontSize};
  font-weight: 600;
`;

const SectionText = styled(Text)`
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const List = styled.ul`
  margin: ${({ theme }) => theme.spacing.xs} 0 ${({ theme }) => theme.spacing.sm} 0;
  padding-left: 20px;
  list-style: disc;
`;

const ListItem = styled.li`
  margin-bottom: ${({ theme }) => theme.spacing.xxs};
`;

const PrivacyPolicyPage: React.FC = () => {
  const theme = useTheme() as DefaultTheme;

  useDocumentTitle("Polityka prywatności | Inquizitor");

  return (
    <Flex
      $direction="column"
      $bg="transparent"
      style={{ minHeight: "100%" }}
    >
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
                  Polityka Prywatności Aplikacji Inquizitor
                </Heading>
                <Text $variant="body2" $tone="muted">
                  Ostatnia aktualizacja: 22.02.2025
                </Text>
              </Stack>

              <SectionText style={{ marginTop: theme.spacing.md }}>
                Szanujemy Twoją prywatność. Niniejsza Polityka Prywatności wyjaśnia, w jaki sposób zbieramy, wykorzystujemy i chronimy Twoje dane osobowe podczas korzystania z aplikacji Inquizitor (dalej „Serwis").
              </SectionText>

              <SectionHeading $level="h3" as="h2">
                §1. Administrator Danych Osobowych
              </SectionHeading>
              <SectionText>
                Administratorem Twoich danych osobowych jest Jakub Karoń, zamieszkały w Krakowie, kontakt e-mail:{" "}
                <Box as="a" href="mailto:inquizitor.app@gmail.com" style={{ color: theme.colors.brand.primary, textDecoration: "underline" }}>
                  inquizitor.app@gmail.com
                </Box>{" "}
                (dalej „Administrator").
              </SectionText>
              <SectionText>
                W związku z rozwojem projektu (status startupu), rola Administratora może zostać w przyszłości przeniesiona na nowo utworzony podmiot gospodarczy (spółkę), o czym Użytkownicy zostaną poinformowani z odpowiednim wyprzedzeniem.
              </SectionText>

              <SectionHeading $level="h3" as="h2">
                §2. Jakie dane zbieramy i w jakim celu
              </SectionHeading>
              <SectionText>
                Przetwarzamy Twoje dane w następujących, konkretnych celach:
              </SectionText>

              <SubHeading $level="h4" as="h3">
                Rejestracja i logowanie (Google OAuth)
              </SubHeading>
              <SectionText>
                <strong>Cel:</strong> W celu utworzenia konta i umożliwienia logowania korzystamy z usługi uwierzytelniania dostarczanej przez Google LLC.
              </SectionText>
              <SectionText>
                <strong>Zakres danych:</strong> Adres e-mail, Imię i Nazwisko, Identyfikator użytkownika Google, Zdjęcie profilowe (avatar).
              </SectionText>
              <SectionText>
                <strong>Zgodność z Google API:</strong> Wykorzystanie informacji otrzymanych z interfejsów API Google do innych aplikacji odbywa się zgodnie z Zasadami dotyczącymi danych użytkownika w usługach Google API, w tym z wymaganiami dotyczącymi ograniczonego użytkowania (Limited Use). Dane te nie są przekazywane brokerom danych ani wykorzystywane do celów reklamowych.
              </SectionText>
              <SectionText>
                <strong>Podstawa prawna:</strong> art. 6 ust. 1 lit. b RODO (przetwarzanie jest niezbędne do wykonania umowy – akceptacji Regulaminu).
              </SectionText>

              <SubHeading $level="h4" as="h3">
                Świadczenie usługi (Generator Testów AI)
              </SubHeading>
              <SectionText>
                <strong>Cel:</strong> Przetwarzamy materiały edukacyjne (teksty, pliki) przesłane przez Ciebie w celu wygenerowania pytań testowych. Treści te są przekazywane do modelu językowego (Gemini API), ale nie są wykorzystywane do trenowania publicznych modeli AI w sposób identyfikujący Użytkownika. Przesłane pliki są bezpiecznie przechowywane na naszych serwerach, dzięki czemu możesz do nich wracać i ponownie z nich korzystać w przyszłości w ramach swojego konta.
              </SectionText>
              <SectionText>
                <strong>Podstawa prawna:</strong> art. 6 ust. 1 lit. b RODO (przetwarzanie jest niezbędne do wykonania umowy).
              </SectionText>

              <SubHeading $level="h4" as="h3">
                Analityka i poprawa jakości usług
              </SubHeading>
              <SectionText>
                <strong>Cel:</strong> Zbieramy dane techniczne dotyczące Twojego urządzenia oraz sposobu korzystania z aplikacji (np. kliknięcia, odwiedzone podstrony, czas sesji), aby zrozumieć, jak ulepszyć Serwis.
              </SectionText>
              <SectionText>
                <strong>Podstawa prawna:</strong> art. 6 ust. 1 lit. f RODO (prawnie uzasadniony interes administratora, polegający na rozwoju i optymalizacji aplikacji).
              </SectionText>

              <SubHeading $level="h4" as="h3">
                Bezpieczeństwo i monitorowanie błędów
              </SubHeading>
              <SectionText>
                <strong>Cel:</strong> W przypadku wystąpienia błędu technicznego system może automatycznie zarejestrować dane diagnostyczne (adres IP, typ przeglądarki, ścieżka błędu), co pozwala nam na szybką naprawę usterki.
              </SectionText>
              <SectionText>
                <strong>Podstawa prawna:</strong> art. 6 ust. 1 lit. f RODO (prawnie uzasadniony interes administratora, polegający na dbaniu o bezpieczeństwo i stabilność działania Serwisu).
              </SectionText>

              <SectionHeading $level="h3" as="h2">
                §3. Odbiorcy danych (Zaufani Partnerzy)
              </SectionHeading>
              <SectionText>
                Aby zapewnić działanie Serwisu, korzystamy ze sprawdzonych dostawców usług technologicznych (Procesorów Danych). Twoje dane mogą być powierzane następującym kategoriom odbiorców:
              </SectionText>
              <List>
                <ListItem>
                  <Text as="span"><strong>Dostawcy usług chmurowych i hostingu:</strong> Korzystamy z serwerów zlokalizowanych na terenie Europejskiego Obszaru Gospodarczego (EOG), dostarczanych m.in. przez Hetzner Online GmbH. Gwarantuje to wysoki standard ochrony danych zgodny z RODO.</Text>
                </ListItem>
                <ListItem>
                  <Text as="span"><strong>Dostawcy usług AI i uwierzytelniania:</strong> Google LLC – w zakresie obsługi logowania (OAuth) oraz generowania treści (Gemini API).</Text>
                </ListItem>
                <ListItem>
                  <Text as="span"><strong>Dostawcy analityki i monitorowania błędów:</strong> Sentry (Functional Software, Inc.) – narzędzie do wykrywania i diagnozowania błędów w aplikacji.</Text>
                </ListItem>
                <ListItem>
                  <Text as="span">PostHog, Inc. – narzędzie do analizy zachowań użytkowników wewnątrz aplikacji (Product Analytics).</Text>
                </ListItem>
              </List>

              <SectionHeading $level="h3" as="h2">
                §4. Przekazywanie danych poza EOG
              </SectionHeading>
              <SectionText>
                Niektórzy z naszych dostawców (np. Google, Sentry, PostHog) mogą posiadać siedziby lub serwery w Stanach Zjednoczonych. W takim przypadku przekazywanie danych odbywa się w oparciu o odpowiednie zabezpieczenia prawne, takie jak:
              </SectionText>
              <List>
                <ListItem><Text as="span">Ramy ochrony danych UE-USA (Data Privacy Framework).</Text></ListItem>
                <ListItem><Text as="span">Standardowe Klauzule Umowne (SCC) zatwierdzone przez Komisję Europejską.</Text></ListItem>
              </List>

              <SectionHeading $level="h3" as="h2">
                §5. Okres przechowywania danych
              </SectionHeading>
              <SectionText>
                Przechowujemy Twoje dane osobowe tylko tak długo, jak jest to konieczne do realizacji celów określonych w niniejszej Polityce:
              </SectionText>
              <List>
                <ListItem><Text as="span"><strong>Dane konta oraz przesłane pliki</strong> – do momentu usunięcia konta przez Użytkownika lub do momentu samodzielnego usunięcia przez Ciebie wgranych materiałów w aplikacji.</Text></ListItem>
                <ListItem><Text as="span"><strong>Dane sesyjne i analityczne</strong> – przez okres niezbędny do analizy statystyk, nie dłużej niż 2 lata.</Text></ListItem>
              </List>

              <SectionHeading $level="h3" as="h2">
                §6. Prawa Użytkownika
              </SectionHeading>
              <SectionText>
                Zgodnie z RODO przysługują Ci następujące prawa:
              </SectionText>
              <List>
                <ListItem><Text as="span">Prawo dostępu do swoich danych.</Text></ListItem>
                <ListItem><Text as="span">Prawo do sprostowania (poprawiania) swoich danych.</Text></ListItem>
                <ListItem><Text as="span">Prawo do usunięcia danych („prawo do bycia zapomnianym") – możesz w każdej chwili usunąć swoje konto wraz ze wszystkimi wgranymi materiałami i danymi, korzystając z opcji w ustawieniach profilu lub kontaktując się z nami.</Text></ListItem>
                <ListItem><Text as="span">Prawo do ograniczenia przetwarzania.</Text></ListItem>
                <ListItem><Text as="span">Prawo do przenoszenia danych.</Text></ListItem>
                <ListItem><Text as="span">Prawo do wniesienia sprzeciwu wobec przetwarzania danych opartego na prawnie uzasadnionym interesie Administratora (np. w celach analitycznych).</Text></ListItem>
                <ListItem><Text as="span">Prawo do wniesienia skargi do organu nadzorczego (w Polsce jest to Prezes Urzędu Ochrony Danych Osobowych – PUODO), jeśli uznasz, że przetwarzanie Twoich danych narusza przepisy RODO.</Text></ListItem>
              </List>
              <SectionText>
                W celu realizacji swoich praw skontaktuj się z Administratorem pod adresem e-mail wskazanym w §1.
              </SectionText>

              <SectionHeading $level="h3" as="h2">
                §7. Pliki Cookies i Technologie Śledzące
              </SectionHeading>
              <SectionText>
                Serwis wykorzystuje pliki cookies (ciasteczka) oraz pamięć lokalną przeglądarki (Local Storage) w celach:
              </SectionText>
              <List>
                <ListItem><Text as="span"><strong>Niezbędnych:</strong> Utrzymanie sesji zalogowanego użytkownika (bez tych plików korzystanie z aplikacji jest niemożliwe).</Text></ListItem>
                <ListItem><Text as="span"><strong>Analitycznych (PostHog):</strong> Zbieranie anonimowych statystyk pomagających nam ulepszać funkcjonalność aplikacji. Cookies analityczne są uruchamiane wyłącznie pod warunkiem wyrażenia przez Ciebie zgody.</Text></ListItem>
              </List>
              <SectionText>
                Możesz zarządzać ustawieniami plików cookies bezpośrednio w swojej przeglądarce internetowej.
              </SectionText>

              <SectionHeading $level="h3" as="h2">
                §8. Kontakt
              </SectionHeading>
              <SectionText style={{ marginBottom: 0 }}>
                W razie pytań dotyczących niniejszej Polityki Prywatności lub sposobu przetwarzania Twoich danych, prosimy o kontakt pod adresem:{" "}
                <Box as="a" href="mailto:inquizitor.app@gmail.com" style={{ color: theme.colors.brand.primary, textDecoration: "underline" }}>
                  inquizitor.app@gmail.com
                </Box>.
              </SectionText>
            </Box>
          </PageContainer>
        </PageSection>
      </Flex>
    </Flex>
  );
};

export default PrivacyPolicyPage;
