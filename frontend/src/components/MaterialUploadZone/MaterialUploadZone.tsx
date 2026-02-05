import React, { useState, useCallback, useRef, useImperativeHandle, forwardRef } from "react";
import styled, { css } from "styled-components";
import { Box, Flex, Stack, Text, Button } from "../../design-system/primitives";
import { AlertBar } from "../../design-system/patterns";
import type { MaterialUploadResponse } from "../../services/materials";
import { Ring } from "ldrs/react";
import "ldrs/react/Ring.css";

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

export interface UploadingMaterial {
  tempId: string;
  filename: string;
  sizeBytes: number;
  status: "uploading" | "failed";
  error?: string;
}

export interface MaterialUploadZoneProps {
  onUpload: (files: File[]) => Promise<void>;
  uploading?: boolean;
  uploadingMaterials?: UploadingMaterial[];
  materials?: MaterialUploadResponse[];
  onRemoveMaterial?: (materialId: number) => void;
  onRemoveUpload?: (tempId: string) => void;
  materialLimitExceeded?: boolean;
  totalMaterialPages?: number;
  showMaterialList?: boolean;
  accept?: string;
  hint?: string;
  disabled?: boolean;
}

export interface MaterialUploadZoneRef {
  openFileDialog: () => void;
}

const MaterialUploadZone = forwardRef<MaterialUploadZoneRef, MaterialUploadZoneProps>(
  (
    {
      onUpload,
      uploading = false,
      uploadingMaterials = [],
      materials = [],
      onRemoveMaterial,
      onRemoveUpload,
      materialLimitExceeded = false,
      totalMaterialPages = 0,
      showMaterialList = false,
      accept = ".pdf,.docx,.txt,.md,.png,.jpg,.jpeg",
      hint,
      disabled = false,
    },
    ref
  ) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
      openFileDialog: () => {
        fileInputRef.current?.click();
      },
    }));

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
      async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0 && !disabled) {
          await onUpload(files);
        }
      },
      [onUpload, disabled]
    );

    const handleFileInputChange = useCallback(
      async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0 && !disabled) {
          await onUpload(files);
        }
        // Reset input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      },
      [onUpload, disabled]
    );

    const handleButtonClick = useCallback((e?: React.MouseEvent) => {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }
      if (!disabled) {
        fileInputRef.current?.click();
      }
    }, [disabled]);

    const hasFiles = uploadingMaterials.length > 0 || materials.length > 0;

    return (
      <Stack $gap="md">
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple
          onChange={handleFileInputChange}
          style={{ display: "none" }}
          disabled={disabled}
        />

        {!hasFiles ? (
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
            onClick={handleButtonClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              pointerEvents: disabled || uploading ? "none" : "auto",
              opacity: disabled || uploading ? 0.6 : 1,
            }}
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
              {hint || "PDF, Docx, TXT lub zdjęcia (maksymalnie 20 stron łącznie)"}
            </Text>
            <Box $mt="lg" onClick={(e) => e.stopPropagation()}>
              <Button $variant="primary" onClick={handleButtonClick} disabled={uploading || disabled}>
                {uploading ? "Przesyłanie..." : "Wybierz pliki"}
              </Button>
            </Box>
          </DropZone>
        ) : (
          <Box $display="inline-flex" style={{ gap: "12px" }}>
            <Button $variant="info" onClick={handleButtonClick} disabled={uploading || disabled}>
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
                style={{ minHeight: "42px", pointerEvents: disabled || uploading ? "none" : "auto" }}
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

        {showMaterialList && (uploadingMaterials.length > 0 || materials.length > 0) && (
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
                {onRemoveUpload && (
                  <Button
                    $variant="danger"
                    onClick={() => onRemoveUpload(upload.tempId)}
                    disabled={upload.status === "uploading"}
                    style={{ padding: "4px 8px", fontSize: "12px" }}
                  >
                    Usuń
                  </Button>
                )}
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
                  </Box>
                  {onRemoveMaterial && (
                    <Button
                      $variant="danger"
                      onClick={() => onRemoveMaterial(material.id)}
                      disabled={uploading}
                      style={{ padding: "4px 8px", fontSize: "12px" }}
                    >
                      Usuń
                    </Button>
                  )}
                </Flex>
              );
            })}
          </Stack>
        )}
      </Stack>
    );
  }
);

MaterialUploadZone.displayName = "MaterialUploadZone";

export default MaterialUploadZone;

