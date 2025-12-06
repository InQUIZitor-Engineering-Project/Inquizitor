import React from "react";
import { Box, Button, Flex, Heading, Stack, Text } from "../../../design-system/primitives";

interface TermsModalProps {
  onClose: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({ onClose }) => {
  return (
    <Flex
      $align="center"
      $justify="center"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 1000,
        padding: 16,
      }}
      onClick={onClose}
    >
      <Box
        $bg="#fff"
        $radius="lg"
        $shadow="md"
        $p="lg"
        style={{
          width: "100%",
          maxWidth: 720,
        maxHeight: "85vh",
        overflowY: "auto",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Flex $justify="space-between" $align="center" $mb="md">
          <Heading $level="h3" as="h3">
            Warunki korzystania z generatora testów
          </Heading>
        </Flex>

        <Stack $gap="lg">
          <Stack $gap="sm">
            <Heading $level="h4" as="h4">
              1. Prawa Własności Intelektualnej
            </Heading>
            <Text $variant="body3">
              Użytkownik oświadcza, że jest właścicielem praw autorskich do przesłanych materiałów edukacyjnych (tekstów,
              plików, grafik) lub posiada stosowną licencję/zgodę na ich wykorzystanie. Korzystając z Aplikacji,
              Użytkownik udziela jej operatorowi ograniczonej, niewyłącznej, nieodpłatnej licencji na wykorzystanie
              przesłanych treści wyłącznie w celu i na czas niezbędny do wygenerowania testu.
            </Text>
          </Stack>

          <Stack $gap="sm">
            <Heading $level="h4" as="h4">
              2. Przetwarzanie Danych przez Model AI (Google Gemini)
            </Heading>
            <Text $variant="body3">
              Użytkownik przyjmuje do wiadomości i akceptuje fakt, że w celu świadczenia usługi (wygenerowania pytań
              testowych), treść przesłanych materiałów jest przekazywana do zewnętrznego dostawcy technologii – firmy
              Google LLC, za pośrednictwem interfejsu programistycznego Gemini API.
            </Text>
            <ul style={{ paddingLeft: 18, margin: 0 }}>
              <li>
                <Text $variant="body3">
                  Przekazanie danych jest niezbędne do technicznego wykonania usługi.
                </Text>
              </li>
              <li>
                <Text $variant="body3">
                  Dane są przetwarzane zgodnie z polityką prywatności i bezpieczeństwa Google Cloud AI.
                </Text>
              </li>
            </ul>
          </Stack>

          <Stack $gap="sm">
            <Heading $level="h4" as="h4">
              3. Odpowiedzialność Użytkownika
            </Heading>
            <Text $variant="body3">
              Użytkownik ponosi wyłączną odpowiedzialność za treść przesyłanych materiałów. Zabrania się przesyłania
              treści naruszających prawa osób trzecich, poufnych danych osobowych (RODO), treści obraźliwych lub
              niezgodnych z prawem.
            </Text>
          </Stack>

          <Stack $gap="sm">
            <Heading $level="h4" as="h4">
              4. Ograniczenie Odpowiedzialności
            </Heading>
            <Text $variant="body3">
              Testy generowane są automatycznie przez algorytmy sztucznej inteligencji (LLM). Mimo wysokiej skuteczności
              modeli językowych, system może generować odpowiedzi nieprecyzyjne lub błędne merytorycznie. Użytkownik
              zobowiązany jest do samodzielnej weryfikacji testu przed jego użyciem.
            </Text>
          </Stack>
        </Stack>

        <Flex $justify="flex-end" $mt="lg">
          <Button onClick={onClose}>Rozumiem</Button>
        </Flex>
      </Box>
    </Flex>
  );
};

export default TermsModal;
