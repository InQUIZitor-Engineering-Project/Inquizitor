import React from "react";
import { Box, Flex, Divider, Select, Input, Checkbox, Button } from "../../../design-system/primitives";
import { CollapsibleSection, FormField } from "../../../design-system/patterns";
import type { PdfExportConfig } from "../../../services/test";
import { useTheme } from "styled-components";

export interface PdfConfigSectionProps {
  config: PdfExportConfig;
  isOpen: boolean;
  onToggle: () => void;
  onChange: (updater: (cfg: PdfExportConfig) => PdfExportConfig) => void;
  onReset: () => void;
}

const PdfConfigSection: React.FC<PdfConfigSectionProps> = ({
  config,
  isOpen,
  onToggle,
  onChange,
  onReset,
}) => {
  const theme = useTheme();
  const isActive =
    config.answer_space_style !== "blank" ||
    config.space_height_cm !== 3 ||
    config.include_answer_key ||
    config.generate_variants ||
    config.use_scratchpad ||
    !config.mark_multi_choice;

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
        <Box
          $display="grid"
          style={{
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: theme.spacing.sm,
            marginBottom: theme.spacing.md,
          }}
        >
          <FormField label="Styl pola odpowiedzi" fullWidth>
            <Select
              value={config.answer_space_style}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                onChange((cfg) => ({
                  ...cfg,
                  answer_space_style: e.target.value as PdfExportConfig["answer_space_style"],
                }))
              }
            >
              <option value="blank">Puste miejsce</option>
              <option value="lines">Linie do pisania</option>
              <option value="grid">Kratka</option>
            </Select>
          </FormField>

          <FormField label="Wysokość pola odpowiedzi (cm)" fullWidth>
            <Input
              $size="sm"
              type="number"
              min={1}
              max={10}
              step={0.5}
              value={config.space_height_cm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onChange((cfg) => ({
                  ...cfg,
                  space_height_cm: Math.max(1, Math.min(10, Number(e.target.value) || 1)),
                }))
              }
            />
          </FormField>
        </Box>

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
          <FormField label="Tryb drugiej grupy" fullWidth>
            <Select
              value={config.variant_mode || "shuffle"}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                onChange((cfg) => ({
                  ...cfg,
                  variant_mode: e.target.value as PdfExportConfig["variant_mode"],
                }))
              }
            >
              <option value="shuffle">Przetasuj w obrębie trudności</option>
              <option value="llm_variant">Nowe pytania o tej samej trudności</option>
            </Select>
          </FormField>
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
