import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Box, Flex, Divider, Input, Checkbox, Button } from "../../../design-system/primitives";
import { CollapsibleSection, FormField, CustomSelect } from "../../../design-system/patterns";
import type { PdfExportConfig } from "../../../services/test";

const ConfigGrid = styled(Box)`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};

  ${({ theme }) => theme.media.down("sm")} {
    grid-template-columns: 1fr;
    gap: ${({ theme }) => theme.spacing.sm};
  }
`;

const ErrorText = styled.span`
  position: absolute;
  left: 0;
  bottom: -2px;
  font-size: 11px;
  line-height: 12px;
  color: ${({ theme }) => theme.colors.danger.main};
  pointer-events: none;
`;

const FieldWrapper = styled.div`
  position: relative;
  display: block;
`;

const VariantModeWrapper = styled(Box)`
  width: 100%;
  max-width: 50%;

  ${({ theme }) => theme.media.down("sm")} {
    max-width: 100%;
  }
`;

export interface PdfConfigSectionProps {
  config: PdfExportConfig;
  isOpen: boolean;
  onToggle: () => void;
  onChange: (updater: (cfg: PdfExportConfig) => PdfExportConfig) => void;
  onReset: () => void;
  onValidityChange?: (isValid: boolean) => void;
}

const PdfConfigSection: React.FC<PdfConfigSectionProps> = ({
  config,
  isOpen,
  onToggle,
  onChange,
  onReset,
  onValidityChange,
}) => {
  const MIN_SPACE_HEIGHT = 1;
  const MAX_SPACE_HEIGHT = 10;

  const isActive =
    config.answer_space_style !== "blank" ||
    config.space_height_cm !== 3 ||
    config.include_answer_key ||
    config.generate_variants ||
    config.use_scratchpad ||
    !config.mark_multi_choice;

  const [spaceHeight, setSpaceHeight] = useState(String(config.space_height_cm ?? 3));
  const [spaceHeightError, setSpaceHeightError] = useState<string | null>(null);

  useEffect(() => {
    setSpaceHeight(String(config.space_height_cm ?? 3));
    setSpaceHeightError(null);
  }, [config.space_height_cm]);

  useEffect(() => {
    onValidityChange?.(spaceHeightError === null);
  }, [spaceHeightError, onValidityChange]);

  const validateSpaceHeight = (raw: string): string | null => {
    if (raw === "") return "Podaj liczbę od 1 do 10.";
    const num = Number(raw);
    if (Number.isNaN(num)) return "Wpisz liczbę.";
    if (num < MIN_SPACE_HEIGHT || num > MAX_SPACE_HEIGHT) return "Zakres: 1–10 cm.";
    return null;
  };

  const commitSpaceHeight = (raw: string) => {
    const error = validateSpaceHeight(raw);
    if (error) {
      setSpaceHeightError(error);
      return;
    }
    setSpaceHeightError(null);
    const num = Number(raw);
    onChange((cfg) => ({
      ...cfg,
      space_height_cm: num,
    }));
  };

  const handleSpaceHeightChange = (raw: string) => {
    setSpaceHeight(raw);
    setSpaceHeightError(validateSpaceHeight(raw));
  };

  const handleSpaceHeightBlur = () => {
    if (spaceHeight === "") {
      // pokaż błąd, ale nie nadpisuj stanu config
      setSpaceHeightError("Podaj liczbę od 1 do 10.");
      return;
    }
    commitSpaceHeight(spaceHeight);
  };

  const handleSpaceHeightKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      commitSpaceHeight(spaceHeight);
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <Box $mt="lg" $mb="sm">
      <CollapsibleSection
        title="Personalizacja PDF (opcjonalne)"
        hint="Ustaw parametry eksportu przed pobraniem."
        isOpen={isOpen}
        onToggle={onToggle}
        isActive={isActive}
        withCard
      >
        <Box $my="sm">
          <Divider />
        </Box>
        <ConfigGrid>
          <FormField label="Styl pola odpowiedzi" fullWidth>
            <CustomSelect
              value={config.answer_space_style}
              $fullWidth
              options={[
                { value: "blank", label: "Puste miejsce" },
                { value: "lines", label: "Linie do pisania" },
                { value: "grid", label: "Kratka" },
              ]}
              onChange={(value) =>
                onChange((cfg) => ({
                  ...cfg,
                  answer_space_style: value as PdfExportConfig["answer_space_style"],
                }))
              }
            />
          </FormField>

          <FormField label="Wysokość pola odpowiedzi (cm)" fullWidth>
            <FieldWrapper style={spaceHeightError ? { paddingBottom: 14 } : undefined}>
              <Input
                $size="md"
                $fullWidth
                type="number"
                inputMode="decimal"
                step="any"
                min={MIN_SPACE_HEIGHT}
                max={MAX_SPACE_HEIGHT}
                placeholder="1-10"
                style={{ minHeight: 41.6 }}
                value={spaceHeight}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleSpaceHeightChange(e.target.value)
                }
                onBlur={handleSpaceHeightBlur}
                onKeyDown={handleSpaceHeightKeyDown}
              />
              {spaceHeightError && <ErrorText>{spaceHeightError}</ErrorText>}
            </FieldWrapper>
          </FormField>

        </ConfigGrid>

        <FormField fullWidth>
          <Flex $align="center" $gap="xs">
            <Checkbox
              id="pdf-student-header"
              checked={config.student_header}
              onChange={(e) =>
                onChange((cfg) => ({
                  ...cfg,
                  student_header: e.target.checked,
                }))
              }
            />
            <label htmlFor="pdf-student-header" style={{ cursor: "pointer" }}>
              Dodaj linię na imię i nazwisko ucznia.
            </label>
          </Flex>
        </FormField>

        <FormField fullWidth>
          <Flex $align="center" $gap="xs">
            <Checkbox
              id="pdf-include-answer-key"
              checked={config.include_answer_key}
              onChange={(e) =>
                onChange((cfg) => ({
                  ...cfg,
                  include_answer_key: e.target.checked,
                }))
              }
            />
            <label htmlFor="pdf-include-answer-key" style={{ cursor: "pointer" }}>
              Dołącz klucz odpowiedzi do pytań zamkniętych.
            </label>
          </Flex>
        </FormField>

        <FormField fullWidth>
          <Flex $align="center" $gap="xs">
            <Checkbox
              id="pdf-scratchpad"
              checked={config.use_scratchpad}
              onChange={(e) =>
                onChange((cfg) => ({
                  ...cfg,
                  use_scratchpad: e.target.checked,
                }))
              }
            />
            <label htmlFor="pdf-scratchpad" style={{ cursor: "pointer" }}>
              Dodaj brudnopis na końcu testu.
            </label>
          </Flex>
        </FormField>

        <FormField fullWidth>
          <Flex $align="center" $gap="xs">
            <Checkbox
              id="pdf-generate-variants"
              checked={config.generate_variants}
              onChange={(e) =>
                onChange((cfg) => ({
                  ...cfg,
                  generate_variants: e.target.checked,
                }))
              }
            />
            <label htmlFor="pdf-generate-variants" style={{ cursor: "pointer" }}>
              Wygeneruj dwie wersje (Grupa A i B).
            </label>
          </Flex>
        </FormField>

        {config.generate_variants && (
          <VariantModeWrapper>
            <FormField label="Tryb drugiej grupy" fullWidth>
              <CustomSelect
                value={config.variant_mode || "shuffle"}
                $fullWidth
                options={[
                  { value: "shuffle", label: "Przetasuj w obrębie trudności" },
                  { value: "llm_variant", label: "Nowe pytania o tej samej trudności" },
                ]}
                onChange={(value) =>
                  onChange((cfg) => ({
                    ...cfg,
                    variant_mode: value as PdfExportConfig["variant_mode"],
                  }))
                }
              />
            </FormField>
          </VariantModeWrapper>
        )}

        <FormField fullWidth>
          <Flex $align="center" $gap="xs">
            <Checkbox
              id="pdf-mark-multi-choice"
              checked={config.mark_multi_choice}
              onChange={(e) =>
                onChange((cfg) => ({
                  ...cfg,
                  mark_multi_choice: e.target.checked,
                }))
              }
            />
            <label htmlFor="pdf-mark-multi-choice" style={{ cursor: "pointer" }}>
              Oznacz graficznie pytania wielokrotnego wyboru.
            </label>
          </Flex>
        </FormField>

        <Flex $justify="flex-end" $gap="sm" $wrap="wrap" $mt="sm">
          <Button $variant="ghost" type="button" onClick={onReset}>
            Przywróć domyślne
          </Button>
        </Flex>

      </CollapsibleSection>
    </Box>
  );
};

export default PdfConfigSection;
