import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { Box, Flex, Button, Text } from "../../../design-system/primitives";
import { CloseButton } from "../../../design-system/primitives";
import type { MaterialUploadResponse } from "../../../services/materials";
import { getMaterialFileBlobUrl } from "../../../services/materials";

interface PreviewModalProps {
  material: MaterialUploadResponse | null;
  onClose: () => void;
  onDownload: (materialId: number, filename: string) => void;
}

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.lg};
`;

const Panel = styled(Box)`
  position: relative;
  background: ${({ theme }) => theme.colors.neutral.white};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.elevation["2xl"]};
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const Header = styled(Flex)`
  position: relative;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  padding-right: 40px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral.greyBlue};
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
`;

const ContentArea = styled(Box)`
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.neutral.silver};
`;

const PreviewImage = styled.img`
  max-width: 100%;
  max-height: 75vh;
  object-fit: contain;
`;

const PreviewIframe = styled.iframe`
  width: 100%;
  height: 75vh;
  border: none;
  border-radius: ${({ theme }) => theme.radii.sm};
`;

const TextPreview = styled.pre`
  width: 100%;
  max-height: 75vh;
  overflow: auto;
  margin: 0;
  padding: ${({ theme }) => theme.spacing.md};
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  text-align: left;
  background: ${({ theme }) => theme.colors.neutral.white};
  border-radius: ${({ theme }) => theme.radii.sm};
  border: 1px solid ${({ theme }) => theme.colors.neutral.greyBlue};
`;

const Footer = styled(Flex)`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border-top: 1px solid ${({ theme }) => theme.colors.neutral.greyBlue};
  gap: ${({ theme }) => theme.spacing.sm};
  justify-content: flex-end;
  flex-shrink: 0;
`;

function isImage(mime: string | null | undefined): boolean {
  return !!mime && mime.startsWith("image/");
}

function isPdf(mime: string | null | undefined, filename: string): boolean {
  if (mime === "application/pdf") return true;
  return (filename || "").toLowerCase().endsWith(".pdf");
}

const PreviewModal: React.FC<PreviewModalProps> = ({
  material,
  onClose,
  onDownload,
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!material) {
      setBlobUrl(null);
      setError(null);
      return;
    }

    const needBlob = isImage(material.mime_type) || isPdf(material.mime_type, material.filename);
    if (!needBlob) {
      setBlobUrl(null);
      setError(null);
      return;
    }

    let revoked = false;
    setLoading(true);
    setError(null);
    getMaterialFileBlobUrl(material.id)
      .then((url) => {
        if (!revoked) setBlobUrl(url);
      })
      .catch((err) => {
        if (!revoked) setError(err instanceof Error ? err.message : "Nie udało się załadować pliku");
      })
      .finally(() => {
        if (!revoked) setLoading(false);
      });

    return () => {
      revoked = true;
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [material?.id]);

  if (!material) return null;

  const showImage = isImage(material.mime_type) && blobUrl;
  const showPdf = isPdf(material.mime_type, material.filename) && blobUrl;
  const textContent = material.markdown_twin || material.extracted_text || null;
  const showText = !showImage && !showPdf && !!textContent;
  const noPreview = !showImage && !showPdf && !showText;

  return (
    <Backdrop onClick={onClose}>
      <Panel onClick={(e) => e.stopPropagation()}>
        <Header>
          <Text $variant="body2" $weight="medium" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {material.filename}
          </Text>
          <CloseButton onClick={onClose} $top={0} $right={0} aria-label="Zamknij podgląd" />
        </Header>

        <ContentArea>
          {loading && (
            <Text $tone="muted">Ładowanie…</Text>
          )}
          {error && (
            <Text $tone="muted" style={{ color: "var(--color-danger-main, #c62828)" }}>
              {error}
            </Text>
          )}
          {showImage && <PreviewImage src={blobUrl!} alt={material.filename} />}
          {showPdf && <PreviewIframe src={blobUrl!} title={material.filename} />}
          {showText && <TextPreview>{textContent}</TextPreview>}
          {noPreview && !loading && !error && (
            <Text $tone="muted">
              Brak podglądu dla tego formatu. Pobierz plik, aby go otworzyć.
            </Text>
          )}
        </ContentArea>

        <Footer>
          <Button $variant="secondary" $size="md" onClick={onClose}>
            Zamknij
          </Button>
          <Button
            $variant="primary"
            $size="md"
            onClick={() => onDownload(material.id, material.filename)}
          >
            Pobierz
          </Button>
        </Footer>
      </Panel>
    </Backdrop>
  );
};

export default PreviewModal;
