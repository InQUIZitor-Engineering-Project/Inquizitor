import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Box, Card, Flex, Input, Checkbox, Stack, Text, Heading, Divider } from "../../../design-system/primitives";
import { FormField, CustomSelect } from "../../../design-system/patterns";
import type { PdfExportConfig } from "../../../services/test";

const ConfigGrid = styled(Box)`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.sm};
`;

const ErrorText = styled.span`
  position: absolute;
  left: 0;
  bottom: -16px;
  font-size: 11px;
  line-height: 12px;
  color: ${({ theme }) => theme.colors.danger.main};
  pointer-events: none;
`;

const FieldWrapper = styled.div`
  position: relative;
  display: block;
`;

const ToggleLabel = styled.label`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 11px 0;
  cursor: pointer;
  user-select: none;

  &:hover span {
    color: ${({ theme }) => theme.colors.neutral.black};
  }
`;

const ToggleLabelText = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.neutral.dGrey};
  line-height: 1.4;
  transition: color 0.1s ease;
`;

interface ToggleRowProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const ToggleRow: React.FC<ToggleRowProps> = ({ id, label, checked, onChange }) => (
  <ToggleLabel htmlFor={id}>
    <ToggleLabelText>{label}</ToggleLabelText>
    <Checkbox
      id={id}
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
    />
  </ToggleLabel>
);

export interface ConfigSectionProps {
  config: PdfExportConfig;
  onChange: (updater: (cfg: PdfExportConfig) => PdfExportConfig) => void;
  onValidityChange?: (isValid: boolean) => void;
}

const ConfigSection: React.FC<ConfigSectionProps> = ({
  config,
  onChange,
  onValidityChange,
}) => {
  const MIN_SPACE_HEIGHT = 1;
  const MAX_SPACE_HEIGHT = 10;

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

  const handleSpaceHeightChange = (raw: string) => {
    setSpaceHeight(raw);
    const error = validateSpaceHeight(raw);
    setSpaceHeightError(error);
    if (!error && raw !== "") {
      onChange((cfg) => ({ ...cfg, space_height_cm: Number(raw) }));
    }
  };

  const handleSpaceHeightBlur = () => {
    const error = validateSpaceHeight(spaceHeight);
    setSpaceHeightError(error);
    if (!error && spaceHeight !== "") {
      onChange((cfg) => ({ ...cfg, space_height_cm: Number(spaceHeight) }));
    }
  };

  const handleSpaceHeightKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSpaceHeightBlur();
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <Stack $gap="md">

      <Card $variant="elevated">
        <Stack $gap="sm">
          <Box>
            <Heading as="h3" $level="h4">Pole odpowiedzi</Heading>
            <Text $variant="body3" $tone="muted" style={{ marginTop: 2 }}>
              Dotyczy pytań otwartych — styl i rozmiar miejsca na odpowiedź ucznia.
            </Text>
          </Box>

          <Box $mt="xs">
            <ConfigGrid>
              <FormField label="Styl pola" fullWidth>
                <CustomSelect
                  value={config.answer_space_style}
                  $fullWidth
                  options={[
                    { value: "blank", label: "Puste miejsce" },
                    { value: "lines", label: "Linie do pisania" },
                    { value: "grid", label: "Kratka" },
                  ]}
                  onChange={(value) =>
                    onChange((cfg) => ({ ...cfg, answer_space_style: value as PdfExportConfig["answer_space_style"] }))
                  }
                />
              </FormField>

              <FormField label="Wysokość (cm)" fullWidth>
                <FieldWrapper style={spaceHeightError ? { paddingBottom: 16 } : undefined}>
                  <Input
                    $size="md"
                    $fullWidth
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min={MIN_SPACE_HEIGHT}
                    max={MAX_SPACE_HEIGHT}
                    placeholder="1–10"
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
          </Box>

          <Divider />

          <ToggleRow
            id="pdf-mark-multi-choice"
            label="Oznacz pytania wielokrotnego wyboru"
            checked={config.mark_multi_choice}
            onChange={(checked) => onChange((cfg) => ({ ...cfg, mark_multi_choice: checked }))}
          />
        </Stack>
      </Card>

      <Card $variant="elevated">
        <Stack $gap="sm">
          <Box>
            <Heading as="h3" $level="h4">Zawartość arkusza</Heading>
            <Text $variant="body3" $tone="muted" style={{ marginTop: 2 }}>
              Dodatkowe elementy na wydruku.
            </Text>
          </Box>

          <Flex $direction="column">
            <ToggleRow
              id="pdf-student-header"
              label="Linia na imię i nazwisko ucznia"
              checked={config.student_header}
              onChange={(checked) => onChange((cfg) => ({ ...cfg, student_header: checked }))}
            />
            <Divider />
            <ToggleRow
              id="pdf-scratchpad"
              label="Brudnopis na końcu testu"
              checked={config.use_scratchpad}
              onChange={(checked) => onChange((cfg) => ({ ...cfg, use_scratchpad: checked }))}
            />
            <Divider />
            <ToggleRow
              id="pdf-include-answer-key"
              label="Klucz odpowiedzi (pytania zamknięte)"
              checked={config.include_answer_key}
              onChange={(checked) => onChange((cfg) => ({ ...cfg, include_answer_key: checked }))}
            />
          </Flex>
        </Stack>
      </Card>

    </Stack>
  );
};

export default ConfigSection;
