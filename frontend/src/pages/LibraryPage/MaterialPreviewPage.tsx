import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { Box, Button, Text } from "../../design-system/primitives";
import { PageContainer, PageSection } from "../../design-system/patterns";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { getMaterial, downloadMaterial, type MaterialUploadResponse } from "../../services/materials";

const TextContent = styled.pre`
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.lg};
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  text-align: left;
  background: ${({ theme }) => theme.colors.neutral.white};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.neutral.greyBlue};
  box-shadow: ${({ theme }) => theme.elevation.sm};
`;

const EmptyPreviewBox = styled(Box)`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.neutral.silver};
  border-radius: ${({ theme }) => theme.radii.md};
`;

const MaterialPreviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [material, setMaterial] = useState<MaterialUploadResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const materialId = id ? parseInt(id, 10) : NaN;
    if (!Number.isFinite(materialId)) {
      setError("Nieprawidłowy identyfikator materiału");
      setLoading(false);
      return;
    }
    getMaterial(materialId)
      .then(setMaterial)
      .catch((err) => setError(err instanceof Error ? err.message : "Nie udało się załadować materiału"))
      .finally(() => setLoading(false));
  }, [id]);

  useDocumentTitle(material ? `${material.filename} – Podgląd | Inquizitor` : "Podgląd | Inquizitor");

  const text = material?.markdown_twin || material?.extracted_text || null;
  const hasPreview = !!text?.trim();

  const handleDownload = () => {
    if (!material) return;
    downloadMaterial(material.id, material.filename).catch(() => {});
  };

  if (loading) {
    return (
      <PageSection $py="xl">
        <PageContainer>
          <Text $align="center">Ładowanie…</Text>
        </PageContainer>
      </PageSection>
    );
  }

  if (error || !material) {
    return (
      <PageSection $py="xl">
        <PageContainer>
          <Text $align="center" $tone="muted">
            {error || "Nie znaleziono materiału"}
          </Text>
          <Box $mt="md" style={{ textAlign: "center" }}>
            <Button $variant="secondary" $size="md" onClick={() => navigate("/biblioteka")}>
              Wróć do biblioteki
            </Button>
          </Box>
        </PageContainer>
      </PageSection>
    );
  }

  return (
    <PageSection $py="xl">
      <PageContainer>
        <Box $mb="lg" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <Text $variant="body2" $weight="medium" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {material.filename}
          </Text>
          <Box style={{ display: "flex", gap: "8px" }}>
            <Button $variant="secondary" $size="md" onClick={() => navigate("/biblioteka")}>
              Wróć do biblioteki
            </Button>
            <Button $variant="primary" $size="md" onClick={handleDownload}>
              Pobierz
            </Button>
          </Box>
        </Box>
        {hasPreview ? (
          <TextContent>{text}</TextContent>
        ) : (
          <EmptyPreviewBox>
            <Text $tone="muted" $mb="md">
              Brak podglądu tekstu dla tego pliku. Pobierz plik, aby go otworzyć.
            </Text>
            <Button $variant="primary" $size="md" onClick={handleDownload}>
              Pobierz plik
            </Button>
          </EmptyPreviewBox>
        )}
      </PageContainer>
    </PageSection>
  );
};

export default MaterialPreviewPage;
