import React from "react";
import { Box, Stack, Heading, Text, Button, Textarea } from "../../../design-system/primitives";
import { FormField, AlertBar } from "../../../design-system/patterns";
import SegmentedToggle from "../../../design-system/patterns/SegmentedToggle";
import type { MaterialUploadResponse } from "../../../services/materials";

export interface SourceSectionProps {
  sourceType: "text" | "material";
  onSourceTypeChange: (next: "text" | "material") => void;
  sourceContent: string;
  onSourceContentChange: (value: string) => void;
  materialUploading: boolean;
  materialData: MaterialUploadResponse | null;
  materialError: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onMaterialChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onMaterialButtonClick: () => void;
}

const SourceSection: React.FC<SourceSectionProps> = ({
  sourceType,
  onSourceTypeChange,
  sourceContent,
  onSourceContentChange,
  materialUploading,
  materialData,
  materialError,
  fileInputRef,
  onMaterialChange,
  onMaterialButtonClick,
}) => {
  return (
    <Box as={Stack} $gap="md" $p="lg" $bg="#fff" $radius="xl" $shadow="md">
      <Stack $gap="xs">
        <Heading as="h3" $level="h4">
          Źródło treści
        </Heading>
        <Text $variant="body3" $tone="muted">
          Wybierz, skąd mamy pobrać materiał do wygenerowania pytań.
        </Text>
      </Stack>

      <Box $display="inline-flex" style={{ maxWidth: "100%" }}>
        <SegmentedToggle
          options={[
            { label: "Własny tekst", value: "text" },
            { label: "Materiał dydaktyczny (plik)", value: "material" },
          ]}
          value={sourceType}
          onChange={(v) => onSourceTypeChange(v as "text" | "material")}
        />
      </Box>

      {sourceType === "material" && (
        <Stack $gap="sm">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt,.md,.png,.jpg"
            onChange={onMaterialChange}
            style={{ display: "none" }}
          />
          <Box $display="inline-flex">
            <Button $variant="info" onClick={onMaterialButtonClick} disabled={materialUploading}>
              {materialUploading ? "Wgrywam…" : "Wgraj plik"}
            </Button>
          </Box>
          {materialData && materialData.processing_status === "done" && (
            <Text $variant="body3" $tone="muted">
              Tekst z pliku "{materialData.filename}" został dodany do formularza.
            </Text>
          )}
          {materialError && <AlertBar variant="danger">{materialError}</AlertBar>}
        </Stack>
      )}

      {sourceType === "text" && (
        <FormField label="Treść źródłowa" hint={`${sourceContent.trim().length} znaków`} fullWidth>
          <Textarea
            $fullWidth
            $minHeight="140px"
            value={sourceContent}
            onChange={(e) => onSourceContentChange(e.target.value)}
            placeholder="Wklej treść materiału, notatki z zajęć, fragment podręcznika lub tekst, na podstawie którego chcesz wygenerować test..."
          />
        </FormField>
      )}
    </Box>
  );
};

export default SourceSection;
