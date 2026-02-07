import React, { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { Flex, Stack, Heading, Text, Box } from "../../design-system/primitives";
import { PageContainer, PageSection, Modal } from "../../design-system/patterns";
import SegmentedToggle from "../../design-system/patterns/SegmentedToggle";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import useLibrary from "./hooks/useLibrary";
import MaterialGrid from "./components/MaterialGrid";
import MaterialList from "./components/MaterialList";
import MaterialUploadZone, { type MaterialUploadZoneRef } from "../../components/MaterialUploadZone/MaterialUploadZone";
import EmptyState from "../DashboardPage/components/EmptyState";
import dashboardWelcome from "../../assets/dashboard_welcome.webp";
import { getMaterialFileBlobUrl, downloadMaterial, type MaterialUploadResponse } from "../../services/materials";

const BLOB_REVOKE_DELAY_MS = 15000;

function isImageOrPdf(m: MaterialUploadResponse): boolean {
  const mime = m.mime_type || "";
  const name = (m.filename || "").toLowerCase();
  return mime.startsWith("image/") || mime === "application/pdf" || name.endsWith(".pdf");
}

const ErrorAlert = styled(Box)`
  background: ${({ theme }) => theme.colors.danger.bg};
  border: 1px solid ${({ theme }) => theme.colors.danger.border};
  color: ${({ theme }) => theme.colors.danger.main};
`;

const VIEW_MODE_KEY = "materials_library_view";
type ViewMode = "grid" | "list";

function getStoredViewMode(): ViewMode {
  try {
    const v = localStorage.getItem(VIEW_MODE_KEY);
    if (v === "grid" || v === "list") return v;
  } catch {
    /* ignore */
  }
  return "grid";
}

const LibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const { materials, loading, uploading, error, handleUpload, handleDelete } = useLibrary();
  const [materialIdToDelete, setMaterialIdToDelete] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(getStoredViewMode);
  const uploadZoneRef = useRef<MaterialUploadZoneRef>(null);

  const handleDownload = useCallback(async (materialId: number, filename: string) => {
    try {
      setUploadError(null);
      await downloadMaterial(materialId, filename);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Nie udało się pobrać pliku");
    }
  }, []);

  const handleUseInTest = useCallback(
    (materialId: number) => {
      navigate(`/tests/new/ai?materialIds=${materialId}`);
    },
    [navigate]
  );

  const handleViewModeChange = useCallback((v: ViewMode) => {
    setViewMode(v);
    try {
      localStorage.setItem(VIEW_MODE_KEY, v);
    } catch {
      /* ignore */
    }
  }, []);

  useDocumentTitle("Biblioteka materiałów | Inquizitor");

  const handleUploadWithError = async (files: File[]) => {
    try {
      setUploadError(null);
      await handleUpload(files);
    } catch (err: any) {
      setUploadError(err?.message || "Nie udało się wgrać plików");
    }
  };

  const handleDeleteClick = (materialId: number) => {
    setMaterialIdToDelete(materialId);
  };

  const closeDeleteModal = () => {
    setMaterialIdToDelete(null);
  };

  const handlePreview = useCallback(async (material: MaterialUploadResponse) => {
    if (isImageOrPdf(material)) {
      try {
        const blobUrl = await getMaterialFileBlobUrl(material.id);
        const w = window.open(blobUrl, "_blank", "noopener,noreferrer");
        if (w) setTimeout(() => URL.revokeObjectURL(blobUrl), BLOB_REVOKE_DELAY_MS);
        else URL.revokeObjectURL(blobUrl);
      } catch (err: unknown) {
        setUploadError(err instanceof Error ? err.message : "Nie udało się otworzyć podglądu");
      }
    } else {
      window.open(`${window.location.origin}/biblioteka/materials/${material.id}/preview`, "_blank", "noopener,noreferrer");
    }
  }, []);

  const confirmDelete = async () => {
    if (materialIdToDelete == null) return;
    try {
      await handleDelete(materialIdToDelete);
    } catch (err: any) {
      alert("Nie udało się usunąć materiału: " + (err?.message || err));
    } finally {
      closeDeleteModal();
    }
  };

  if (loading) {
    return (
      <PageSection $py="xl">
        <PageContainer>
          <Text $align="center">Ładowanie...</Text>
        </PageContainer>
      </PageSection>
    );
  }

  // Empty state - full height, no scroll, no upload zone
  if (materials.length === 0) {
    return (
      <>
        <Flex
          $direction="column"
          $bg="#f5f6f8"
          style={{
            height: "100%",
            width: "100%",
            overflow: "hidden",
          }}
        >
          <EmptyState
            illustrationSrc={dashboardWelcome}
            title="Twoja biblioteka jest pusta"
            actionLabel="+ Dodaj materiały"
            onAction={() => {
              uploadZoneRef.current?.openFileDialog();
            }}
          />
        </Flex>
        {/* Hidden upload zone for file dialog */}
        <div style={{ position: "absolute", opacity: 0, pointerEvents: "none", height: 0, overflow: "hidden" }}>
          <MaterialUploadZone
            ref={uploadZoneRef}
            onUpload={handleUploadWithError}
            uploading={uploading}
          />
        </div>
      </>
    );
  }

  // Normal state with materials
  return (
    <Flex $direction="column" $bg="#f5f6f8" style={{ minHeight: "100%" }}>
      <PageSection $py="xl">
        <PageContainer>
          <Stack $gap="lg">
            <Flex $align="center" $justify="space-between" $wrap="wrap" $gap="md">
              <Heading as="h1" $level="h2">
                Biblioteka materiałów
              </Heading>
              <SegmentedToggle<ViewMode>
                options={[
                  { label: "Siatka", value: "grid" },
                  { label: "Lista", value: "list" },
                ]}
                value={viewMode}
                onChange={handleViewModeChange}
              />
            </Flex>

            {(error || uploadError) && (
              <ErrorAlert $p="md" $radius="md">
                <Text $variant="body2">{error || uploadError}</Text>
              </ErrorAlert>
            )}

            <MaterialUploadZone
              ref={uploadZoneRef}
              onUpload={handleUploadWithError}
              uploading={uploading}
            />

            {viewMode === "grid" ? (
              <MaterialGrid
                materials={materials}
                onDelete={handleDeleteClick}
                onDownload={handleDownload}
                onUseInTest={handleUseInTest}
                onPreview={handlePreview}
              />
            ) : (
              <MaterialList
                materials={materials}
                onDelete={handleDeleteClick}
                onDownload={handleDownload}
                onUseInTest={handleUseInTest}
                onPreview={handlePreview}
              />
            )}
          </Stack>
        </PageContainer>
      </PageSection>

      {materialIdToDelete !== null && (
        <Modal
          isOpen={true}
          title="Usuń materiał"
          onClose={closeDeleteModal}
          onConfirm={confirmDelete}
          variant="danger"
          confirmLabel="Usuń"
        >
          Tej operacji nie można cofnąć. Materiał zostanie trwale usunięty.
        </Modal>
      )}
    </Flex>
  );
};

export default LibraryPage;

