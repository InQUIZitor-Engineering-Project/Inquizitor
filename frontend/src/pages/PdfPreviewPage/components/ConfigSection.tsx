import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Box, Flex, Input, Checkbox, Button, Stack, Text } from "../../../design-system/primitives";
import { FormField, CustomSelect } from "../../../design-system/patterns";
import type { PdfExportConfig } from "../../../services/test";

const ConfigGrid = styled(Box)`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  
  ${({ theme }) => theme.media.down("sm")} {
    grid-template-columns: 1fr;
  }
`;

const ErrorText = styled.span`
  position: absolute;
  left: 0;
  bottom: -18px;
  font-size: 11px;
  line-height: 12px;
  color: ${({ theme }) => theme.colors.danger.main};
  pointer-events: none;
`;

const FieldWrapper = styled.div`
  position: relative;
  display: block;
  margin-bottom: 10px;
`;


const SectionHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text 
    $variant="body2" 
    $tone="muted" 
    style={{ marginBottom: 12, display: 'block', fontWeight: 500 }}
  >
    {children}
  </Text>
);

interface ConfigCheckboxProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

const ConfigCheckbox: React.FC<ConfigCheckboxProps> = ({ id, checked, onChange, label }) => (
  <Flex $align="center" $gap="sm">
    <Checkbox
      id={id}
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
    />
    <label htmlFor={id} style={{ cursor: "pointer", fontSize: 14 }}>
      {label}
    </label>
  </Flex>
);

export interface PdfConfigSectionProps {
  config: PdfExportConfig;
  onChange: (updater: (cfg: PdfExportConfig) => PdfExportConfig) => void;
  onReset: () => void;
  onValidityChange?: (isValid: boolean) => void;
}

const ConfigSection: React.FC<PdfConfigSectionProps> = ({
  config,
  onChange,
  onReset,
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
    if (spaceHeight === "") {
      setSpaceHeightError("Podaj liczbę od 1 do 10.");
      return;
    }
    const error = validateSpaceHeight(spaceHeight);
    if (!error) {
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
    <Stack $gap="xl">
      
      <Box>
        <SectionHeader>Wygląd arkusza</SectionHeader>
        
        <ConfigGrid>
          <FormField label="Styl pola" fullWidth>
            <CustomSelect
              value={config.answer_space_style}
              $fullWidth
              options={[
                { value: "blank", label: "Puste miejsce" },
                { value: "lines", label: "Linie" },
                { value: "grid", label: "Kratka" },
              ]}
              onChange={(value) =>
                onChange((cfg) => ({ ...cfg, answer_space_style: value as any }))
              }
            />
          </FormField>

          <FormField label="Wysokość pola (cm)" fullWidth>
            <FieldWrapper style={spaceHeightError ? { paddingBottom: 14 } : undefined}>
                <Input
                    $size="md" $fullWidth type="number" inputMode="decimal" step="any"
                    min={MIN_SPACE_HEIGHT} max={MAX_SPACE_HEIGHT} placeholder="1-10"
                    style={{ minHeight: 41.6 }}
                    value={spaceHeight}
                    onChange={(e) => handleSpaceHeightChange(e.target.value)}
                    onBlur={handleSpaceHeightBlur}
                    onKeyDown={handleSpaceHeightKeyDown}
                />
            {spaceHeightError && <ErrorText>{spaceHeightError}</ErrorText>}
            </FieldWrapper>
          </FormField>
        </ConfigGrid>

        <ConfigCheckbox 
          id="pdf-mark-multi-choice"
          label="Oznacz graficznie pytania wielokrotnego wyboru"
          checked={config.mark_multi_choice}
          onChange={(checked) => onChange(cfg => ({ ...cfg, mark_multi_choice: checked }))}
        />
      </Box>

      <Box>
        <SectionHeader>Ustawienia ogólne</SectionHeader>
        <Stack $gap="md">
          <ConfigCheckbox 
             id="pdf-student-header"
             label="Dodaj linię na imię i nazwisko ucznia"
             checked={config.student_header}
             onChange={(checked) => onChange(cfg => ({ ...cfg, student_header: checked }))}
          />
          <ConfigCheckbox 
             id="pdf-scratchpad"
             label="Dodaj brudnopis na końcu testu"
             checked={config.use_scratchpad}
             onChange={(checked) => onChange(cfg => ({ ...cfg, use_scratchpad: checked }))}
          />
          <ConfigCheckbox 
             id="pdf-include-answer-key"
             label="Dołącz klucz odpowiedzi do pytań zamkniętych"
             checked={config.include_answer_key}
             onChange={(checked) => onChange(cfg => ({ ...cfg, include_answer_key: checked }))}
          />
        </Stack>
      </Box>

      <Box $mt="sm">
        <Button 
          $size="sm" 
          $variant="outline"
          onClick={onReset} 
          style={{ width: "100%" }}
        >
          Przywróć ustawienia domyślne
        </Button>
      </Box>

    </Stack>
  );
};

export default ConfigSection;