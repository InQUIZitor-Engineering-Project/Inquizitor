import React from "react";
import { Card, Flex, Stack, Text, Box, Badge } from "../../../design-system/primitives";
import type { MaterialUploadResponse } from "../../../services/materials";
import styled from "styled-components";
import { formatFileSize, formatDate, getStatusLabel, getPageLabel, getStatusBadgeVariant } from "../utils/materialFormatters";
import MaterialActionsMenu from "./MaterialActionsMenu";

interface MaterialCardProps {
  material: MaterialUploadResponse;
  onDelete: (materialId: number) => void;
  onDownload: (materialId: number, filename: string) => void;
  onUseInTest: (materialId: number) => void;
  onPreview?: (material: MaterialUploadResponse) => void;
}

const CardContent = styled(Card)`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-width: 0;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: default;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows["8px"]};
  }

`;

const FileIcon = styled(Box)`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.tint.t4};
  border-radius: ${({ theme }) => theme.radii.sm};
  flex-shrink: 0;
`;

/* A4 ratio: 130 * sqrt(2) ≈ 184px – compact thumbnail for grid density */
const THUMB_WIDTH = 130;
const THUMB_HEIGHT = 184;

/* Wrapper: full width, fixed height, centers thumbnail/placeholder; clickable for preview */
const ThumbnailWrapper = styled(Box)<{ $clickable?: boolean }>`
  width: 100%;
  height: ${THUMB_HEIGHT}px;
  min-height: ${THUMB_HEIGHT}px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  cursor: ${(p) => (p.$clickable ? "pointer" : "default")};
`;

const ThumbnailContainer = styled(Box)`
  width: ${THUMB_WIDTH}px;
  height: ${THUMB_HEIGHT}px;
  border-radius: ${({ theme }) => theme.radii.md};
  overflow: hidden;
  background: ${({ theme }) => theme.colors.tint.t5};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

/* Placeholder when no thumbnail: same size as thumbnail, icon centered */
const ThumbnailPlaceholder = styled(Box)`
  width: ${THUMB_WIDTH}px;
  height: ${THUMB_HEIGHT}px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.tint.t5};
  border: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

/* Text block: fixed min-height so 1-line and 2-line titles give same card height (2 lines + status + meta) */
const CardTextBlock = styled(Box)`
  position: relative;
  min-width: 0;
  flex: 1;
  min-height: 72px;
`;

const ThumbnailImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: white;
`;

const FileIconSvg = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const getFileIcon = (mimeType: string | null | undefined) => {
  if (!mimeType) return <FileIconSvg />;

  if (mimeType === "application/pdf") {
    return (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    );
  }

  if (mimeType.startsWith("image/")) {
    return (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    );
  }

  return <FileIconSvg />;
};

const MaterialCard: React.FC<MaterialCardProps> = ({
  material,
  onDelete,
  onDownload,
  onUseInTest,
  onPreview,
}) => {
  const [thumbnailError, setThumbnailError] = React.useState(false);
  const [thumbnailBlobUrl, setThumbnailBlobUrl] = React.useState<string | null>(null);
  const hasThumbnail = material.thumbnail_path && !thumbnailError;

  // Load thumbnail with authentication
  React.useEffect(() => {
    if (!hasThumbnail) {
      setThumbnailBlobUrl(null);
      return;
    }

    const loadThumbnail = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const apiBase = import.meta.env.VITE_API_URL || "";
        const url = `${apiBase}/materials/${material.id}/thumbnail`;

        const response = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!response.ok) {
          throw new Error(`Failed to load thumbnail: ${response.status}`);
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        setThumbnailBlobUrl(blobUrl);
      } catch {
        setThumbnailError(true);
        setThumbnailBlobUrl(null);
      }
    };

    loadThumbnail();

    // Cleanup blob URL on unmount or when thumbnail changes
    return () => {
      if (thumbnailBlobUrl) {
        URL.revokeObjectURL(thumbnailBlobUrl);
      }
    };
  }, [material.id, hasThumbnail]);

  const pageLabel = getPageLabel(material.page_count);
  const metaLine = [formatFileSize(material.size_bytes), formatDate(material.created_at)]
    .filter(Boolean)
    .join(" · ");
  const metaTooltip = `Rozmiar: ${formatFileSize(material.size_bytes)}\nDodano: ${formatDate(material.created_at)}`;

  return (
    <CardContent $p="sm" $shadow="md" $variant="elevated" style={{ position: "relative" }}>
      <Stack $gap="xs" style={{ flex: 1, minHeight: 0 }}>
        {/* Block 1: thumbnail or placeholder – click opens preview */}
        <ThumbnailWrapper
          $clickable={!!onPreview}
          onClick={(e) => {
            e.stopPropagation();
            onPreview?.(material);
          }}
          role={onPreview ? "button" : undefined}
          aria-label={onPreview ? "Podgląd pliku" : undefined}
        >
          {thumbnailBlobUrl ? (
            <ThumbnailContainer>
              <ThumbnailImage
                src={thumbnailBlobUrl}
                alt={material.filename}
                onError={() => setThumbnailError(true)}
              />
            </ThumbnailContainer>
          ) : (
            <ThumbnailPlaceholder>
              <FileIcon>{getFileIcon(material.mime_type)}</FileIcon>
            </ThumbnailPlaceholder>
          )}
        </ThumbnailWrapper>

        {/* Block 2: filename + status + meta – fixed min-height so all cards align */}
        <CardTextBlock>
          <Flex $align="center" $gap="xs" style={{ flex: 1, minWidth: 0, paddingRight: "28px" }}>
            <Text
              $variant="body2"
              $weight="medium"
              style={{
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                wordBreak: "break-word",
                flex: 1,
                minWidth: 0,
              }}
              title={material.filename}
            >
              {material.filename}
            </Text>
          </Flex>
          <Flex $align="center" $gap="xs" style={{ marginTop: 2 }} $wrap="wrap">
            <Badge $variant={getStatusBadgeVariant(material.processing_status)}>
              {getStatusLabel(material.processing_status)}
            </Badge>
            {pageLabel ? (
              <Text $variant="body3" $tone="muted">
                · {pageLabel}
              </Text>
            ) : null}
          </Flex>
          {metaLine && (
            <Text
              $variant="body3"
              $tone="muted"
              style={{ marginTop: 2, fontSize: "0.75rem" }}
              title={metaTooltip}
            >
              {metaLine}
            </Text>
          )}
          <Box style={{ position: "absolute", top: 0, right: 0 }}>
            <MaterialActionsMenu
              material={material}
              onDownload={onDownload}
              onUseInTest={onUseInTest}
              onDelete={onDelete}
              $alignRight
            />
          </Box>
        </CardTextBlock>
      </Stack>
    </CardContent>
  );
};

export default MaterialCard;

