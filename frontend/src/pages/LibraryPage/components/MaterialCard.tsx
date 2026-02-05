import React from "react";
import { Card, Flex, Stack, Text, Badge, Box } from "../../../design-system/primitives";
import { CloseButton } from "../../../design-system/primitives";
import type { MaterialUploadResponse } from "../../../services/materials";
import styled from "styled-components";

interface MaterialCardProps {
  material: MaterialUploadResponse;
  onDelete: (materialId: number) => void;
}

const CardContent = styled(Card)`
  position: relative;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: default;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows["8px"]};
  }
`;

const FileIcon = styled(Box)`
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.tint.t5};
  border-radius: ${({ theme }) => theme.radii.md};
  flex-shrink: 0;
`;

const ThumbnailContainer = styled(Box)`
  width: 250px;
  height: 354px; /* A4 ratio: 250 * sqrt(2) ≈ 354px */
  border-radius: ${({ theme }) => theme.radii.md};
  overflow: hidden;
  background: ${({ theme }) => theme.colors.tint.t5};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid ${({ theme }) => theme.colors.border};
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

const formatFileSize = (bytes: number | null | undefined): string => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("pl-PL", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "done":
      return <Badge $variant="success">Gotowy</Badge>;
    case "pending":
      return <Badge $variant="warning">Przetwarzanie</Badge>;
    case "failed":
      return <Badge $variant="danger">Błąd</Badge>;
    default:
      return <Badge $variant="neutral">{status}</Badge>;
  }
};

const MaterialCard: React.FC<MaterialCardProps> = ({ material, onDelete }) => {
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
        console.log(`Successfully loaded thumbnail for material ${material.id}`);
      } catch (error) {
        console.error(`Failed to load thumbnail for material ${material.id}:`, error);
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

  // Debug: log thumbnail_path to console
  React.useEffect(() => {
    if (material.thumbnail_path) {
      console.log(`Material ${material.id} has thumbnail_path:`, material.thumbnail_path);
    } else {
      console.log(`Material ${material.id} has NO thumbnail_path`);
    }
  }, [material.id, material.thumbnail_path]);

  return (
    <CardContent $p="md" $shadow="md" $variant="elevated" style={{ position: "relative" }}>
      <Stack $gap="md">
        {/* Thumbnail - only show if available */}
        {thumbnailBlobUrl && (
          <ThumbnailContainer>
            <ThumbnailImage
              src={thumbnailBlobUrl}
              alt={material.filename}
              onError={(e) => {
                console.error(`Failed to display thumbnail for material ${material.id}:`, e);
                setThumbnailError(true);
              }}
            />
          </ThumbnailContainer>
        )}

        <Flex $align="flex-start" $justify="space-between" $gap="sm" style={{ position: "relative" }}>
          <Flex $align="center" $gap="sm" style={{ flex: 1, minWidth: 0, paddingRight: "32px" }}>
            {/* Show icon only if no thumbnail */}
            {!hasThumbnail && <FileIcon>{getFileIcon(material.mime_type)}</FileIcon>}
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Text
                $variant="body2"
                $weight="medium"
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={material.filename}
              >
                {material.filename}
              </Text>
            </Box>
          </Flex>
          <CloseButton
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onDelete(material.id);
            }}
            aria-label="Usuń materiał"
            $top={8}
            $right={8}
          />
        </Flex>

        <Flex $align="center" $justify="space-between" $gap="xs" $wrap="wrap">
          {getStatusBadge(material.processing_status)}
          {material.page_count && (
            <Text $variant="body3" $tone="muted">
              {material.page_count} {material.page_count === 1 ? "strona" : "stron"}
            </Text>
          )}
        </Flex>

        <Stack $gap="xs">
          <Flex $align="center" $justify="space-between" $gap="sm">
            <Text $variant="body3" $tone="muted">
              Rozmiar:
            </Text>
            <Text $variant="body3" $weight="medium">
              {formatFileSize(material.size_bytes)}
            </Text>
          </Flex>
          <Flex $align="center" $justify="space-between" $gap="sm">
            <Text $variant="body3" $tone="muted">
              Dodano:
            </Text>
            <Text $variant="body3" $weight="medium">
              {formatDate(material.created_at)}
            </Text>
          </Flex>
        </Stack>
      </Stack>
    </CardContent>
  );
};

export default MaterialCard;

