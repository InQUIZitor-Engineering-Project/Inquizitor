import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Card, Stack, Heading, Text, Checkbox, Button, Divider, Flex } from "../../../design-system/primitives";
import { Modal } from "../../../design-system/patterns";
import { useTheme } from "styled-components";

interface ConsentsCardProps {
  termsAccepted: boolean;
  marketingAccepted: boolean;
  onUpdate: (terms: boolean, marketing: boolean) => Promise<void>;
  loading?: boolean;
}

const ConsentsCard: React.FC<ConsentsCardProps> = ({
  termsAccepted,
  marketingAccepted,
  onUpdate,
  loading,
}) => {
  const theme = useTheme();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [localTerms, setLocalTerms] = useState(termsAccepted);
  const [localMarketing, setLocalMarketing] = useState(marketingAccepted);

  const hasChanges = localTerms !== termsAccepted || localMarketing !== marketingAccepted;

  const handleSave = () => {
    onUpdate(localTerms, localMarketing);
  };

  return (
    <Card $p="lg" $shadow="md" $variant="elevated">
      <Stack $gap="md">
        <Stack $gap="4px">
          <Heading $level="h3">Zgody i regulaminy</Heading>
          <Text $variant="body3" $tone="muted">
            Zarządzaj swoimi zgodami. Pamiętaj, że wycofanie zgody na regulamin uniemożliwi generowanie nowych testów z pomocą AI.
          </Text>
        </Stack>

        <Stack $gap="md">
          <Flex $align="flex-start" $gap="sm">
            <Checkbox
              id="terms"
              checked={localTerms}
              onChange={(e) => setLocalTerms(e.target.checked)}
            />
            <Stack $gap="4px">
              <Text as="label" htmlFor="terms" $variant="body2" $weight="medium">
                Akceptuję{" "}
                <Link to="/polityka-prywatnosci" target="_blank" rel="noopener noreferrer" style={{ color: theme.colors.brand.primary, textDecoration: "underline" }}>
                  Warunki Użytkowania i Politykę Prywatności
                </Link>
                {" "}*
              </Text>
              <Text $variant="body3" $tone="muted">
                Wymagane do korzystania z generatora testów AI.{" "}
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  style={{
                    background: "none",
                    border: "none",
                    color: theme.colors.brand.primary,
                    cursor: "pointer",
                    padding: 0,
                    textDecoration: "underline",
                    fontSize: "inherit"
                  }}
                >
                  Zobacz treść
                </button>
              </Text>
            </Stack>
          </Flex>

          <Flex $align="flex-start" $gap="sm">
            <Checkbox
              id="marketing"
              checked={localMarketing}
              onChange={(e) => setLocalMarketing(e.target.checked)}
            />
            <Stack $gap="4px">
              <Text as="label" htmlFor="marketing" $variant="body2" $weight="medium">
                Zgoda na komunikację marketingową
              </Text>
              <Text $variant="body3" $tone="muted">
                Chcę otrzymywać informacje o nowościach i promocjach.
              </Text>
            </Stack>
          </Flex>
        </Stack>

        <Divider />

        <Button 
          onClick={handleSave} 
          disabled={!hasChanges || loading}
          $variant={hasChanges ? "primary" : "outline"}
        >
          {loading ? "Zapisywanie..." : "Zapisz zmiany"}
        </Button>
      </Stack>

      <Modal
        isOpen={isModalOpen}
        title="Warunki korzystania z generatora testów"
        onClose={() => setIsModalOpen(false)}
        maxWidth={720}
        confirmLabel="Rozumiem"
        onConfirm={() => setIsModalOpen(false)}
      >
        <Stack $gap="lg">
          <Text $variant="body3" $tone="muted">
            Pełna{" "}
            <Link to="/polityka-prywatnosci" target="_blank" rel="noopener noreferrer" style={{ color: theme.colors.brand.primary, textDecoration: "underline" }}>
              Polityka prywatności
            </Link>
            {" "}dostępna jest na osobnej stronie.
          </Text>
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
      </Modal>
    </Card>
  );
};

export default ConsentsCard;
