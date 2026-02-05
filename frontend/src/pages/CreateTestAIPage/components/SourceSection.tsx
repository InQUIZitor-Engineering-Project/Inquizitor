import React, { useState, useCallback } from "react";
import styled, { css } from "styled-components";
import {
  Box,
  Flex,
  Stack,
  Heading,
  Text,
  Button,
  Textarea,
} from "../../../design-system/primitives";
import { FormField, AlertBar, Tooltip } from "../../../design-system/patterns";
import SegmentedToggle from "../../../design-system/patterns/SegmentedToggle";
import type { MaterialUploadResponse } from "../../../services/materials";
import { Ring } from "ldrs/react";
import "ldrs/react/Ring.css";

const SegmentedWrapper = styled(Box)`
  display: inline-flex;
  max-width: 100%;

  ${({ theme }) => theme.media.down("sm")} {
    display: flex;
    width: 100%;
  }
`;

const DropZone = styled(Flex)<{ $isDragging: boolean }>`
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  ${({ $isDragging, theme }) =>
    $isDragging &&
    css`
      background-color: ${theme.colors.tint.t5};
      border-color: ${theme.colors.brand.primary};
      transform: scale(1.01);
    `}
`;

const DesktopOnly = styled.span`
  ${({ theme }) => theme.media.down("sm")} {
    display: none;
  }
`;

const MobileOnly = styled.span`
  display: none;
  ${({ theme }) => theme.media.down("sm")} {
    display: inline;
  }
`;

export interface SourceSectionProps {
  sourceType: "text" | "material";
  onSourceTypeChange: (next: "text" | "material") => void;
  sourceContent: string;
  onSourceContentChange: (value: string) => void;
  materialUploading: boolean;
  materialAnalyzing: boolean;
  materials: MaterialUploadResponse[];
  totalMaterialPages: number;
  materialLimitExceeded: boolean;
  uploadingMaterials: {
    tempId: string;
    filename: string;
    sizeBytes: number;
    status: "uploading" | "failed";
    error?: string;
  }[];
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onMaterialChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFilesUpload: (files: File[]) => void;
  onMaterialButtonClick: () => void;
  onRemoveMaterial: (materialId: number) => void;
  onRemoveUpload: (tempId: string) => void;
}

const SourceSection: React.FC<SourceSectionProps> = ({
  sourceType,
  onSourceTypeChange,
  sourceContent,
  onSourceContentChange,
  materialUploading,
  materialAnalyzing,
  materials,
  totalMaterialPages,
  materialLimitExceeded,
  uploadingMaterials,
  fileInputRef,
  onMaterialChange,
  onFilesUpload,
  onMaterialButtonClick,
  onRemoveMaterial,
  onRemoveUpload,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        onFilesUpload(files);
      }
    },
    [onFilesUpload]
  );

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

      <SegmentedWrapper>
        <SegmentedToggle
          options={[
            { label: "Własny tekst", value: "text" },
            { label: "Materiał dydaktyczny", value: "material" },
          ]}
          value={sourceType}
          onChange={(v) => onSourceTypeChange(v as "text" | "material")}
        />
      </SegmentedWrapper>

      <Box>
        {sourceType === "material" && (
          <Stack $gap="md">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.md,.png,.jpg,.jpeg"
              multiple
              onChange={onMaterialChange}
              style={{ display: "none" }}
            />

            {uploadingMaterials.length === 0 && materials.length === 0 ? (
              <DropZone
                $p="xl"
                $direction="column"
                $align="center"
                $justify="center"
                $bg="#f9fafb"
                $radius="xl"
                $border="2px dashed #e5e7eb"
                $height="200px"
                $isDragging={isDragging}
                onClick={onMaterialButtonClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Box $mb="sm" style={{ opacity: 0.5 }}>
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </Box>
              <Text $variant="body2" $weight="medium" $tone="default" $align="center">
                <DesktopOnly>Kliknij lub przeciągnij, aby wgrać pliki</DesktopOnly>
                <MobileOnly>Kliknij, aby wgrać pliki</MobileOnly>
              </Text>
              <Text $variant="body3" $tone="muted" $align="center">
                PDF, Docx, TXT lub zdjęcia (maksymalnie 20 stron łącznie)
              </Text>
              </DropZone>
            ) : (
              <Box $display="inline-flex" style={{ gap: "12px" }}>
                <Button $variant="info" onClick={onMaterialButtonClick}>
                  Dodaj kolejne pliki
                </Button>
                <DesktopOnly>
                  <DropZone
                    $px="lg"
                    $direction="row"
                    $align="center"
                    $bg="#f9fafb"
                    $radius="lg"
                    $border="1px dashed #e5e7eb"
                    $isDragging={isDragging}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    style={{ minHeight: "42px" }}
                  >
                    <Text $variant="body3" $tone="muted">
                      lub przeciągnij tutaj
                    </Text>
                  </DropZone>
                </DesktopOnly>
              </Box>
            )}

            {materialLimitExceeded && (
              <AlertBar variant="danger">
                Przekroczono limit 20 stron (obecnie: {totalMaterialPages}). Usuń niektóre pliki, aby
                kontynuować.
              </AlertBar>
            )}

            {(!!uploadingMaterials.length || !!materials.length) && (
              <Stack $gap="xs">
                {uploadingMaterials.map((upload) => (
                  <Flex
                    key={upload.tempId}
                    $p="sm"
                    $bg="#f9fafb"
                    $border="1px solid #e5e7eb"
                    $radius="md"
                    $align="center"
                    $justify="space-between"
                  >
                    <Stack $gap="xxs" style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        $variant="body3"
                        $weight="medium"
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {upload.filename}
                      </Text>
                      {upload.status === "uploading" && (
                        <Flex $align="center" style={{ gap: "6px" }}>
                          <Ring size={12} speed={1.2} color="#2194f3" />
                          <Text $variant="body3" $tone="info" $weight="medium">
                            Wgrywanie...
                          </Text>
                        </Flex>
                      )}
                    </Stack>
                    <Button
                      $variant="danger"
                      onClick={() => onRemoveUpload(upload.tempId)}
                      disabled={upload.status === "uploading"}
                      style={{ padding: "4px 8px", fontSize: "12px" }}
                    >
                      Usuń
                    </Button>
                  </Flex>
                ))}

                {uploadingMaterials
                  .filter((upload) => upload.status === "failed" && upload.error)
                  .map((upload) => (
                    <AlertBar key={`${upload.tempId}-error`} variant="danger">
                      Błąd {upload.filename}: {upload.error}
                    </AlertBar>
                  ))}

                {materials.map((material) => {
                  const status = material.analysis_status || material.processing_status;
                  const isFailed = status === "failed";
                  const isDone = status === "done";
                  return (
                    <Flex
                      key={material.id}
                      $p="sm"
                      $bg={isFailed ? "#fff5f5" : "#f9fafb"}
                      $border={isFailed ? "1px solid #feb2b2" : "1px solid #e5e7eb"}
                      $radius="md"
                      $align="center"
                      $justify="space-between"
                    >
                      <Box style={{ flex: 1, minWidth: 0 }}>
                        <Flex $align="center" style={{ gap: "8px" }}>
                          <Text
                            $variant="body3"
                            $weight="medium"
                            $tone={isFailed ? "danger" : "default"}
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {material.filename}
                          </Text>
                          {isDone && (
                            <Box style={{ display: "flex", alignItems: "center", color: "#48bb78" }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </Box>
                          )}
                          {isFailed && (
                            <Tooltip content={material.processing_error || "Błąd analizy pliku"}>
                              <Box style={{ display: "flex", alignItems: "center", color: "#e53e3e" }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10" />
                                  <line x1="12" y1="8" x2="12" y2="12" />
                                  <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                              </Box>
                            </Tooltip>
                          )}
                        </Flex>
                      </Box>
                      <Button
                        $variant="danger"
                        onClick={() => onRemoveMaterial(material.id)}
                        disabled={materialUploading || materialAnalyzing}
                        style={{ padding: "4px 8px", fontSize: "12px" }}
                      >
                        Usuń
                      </Button>
                    </Flex>
                  );
                })}
              </Stack>
            )}

            {materialAnalyzing && !!materials.length && (
              <Stack $gap="sm">
                <Flex $align="center" style={{ gap: "8px" }}>
                  <Ring size={18} speed={1.2} color="#2194f3" />
                  <Text $variant="body3" $tone="info" $weight="medium">
                    Analizuję pliki...
                  </Text>
                </Flex>
              </Stack>
            )}

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
              className="ph-no-capture"
            />
          </FormField>
        )}
      </Box>
    </Box>
  );
};

export default SourceSection;
