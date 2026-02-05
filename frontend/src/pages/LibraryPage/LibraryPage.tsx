import React, { useState, useRef } from "react";
import { Flex, Stack, Heading, Text, Box } from "../../design-system/primitives";
import { PageContainer, PageSection, Modal } from "../../design-system/patterns";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import useLibrary from "./hooks/useLibrary";
import MaterialGrid from "./components/MaterialGrid";
import MaterialUploadZone, { type MaterialUploadZoneRef } from "../../components/MaterialUploadZone/MaterialUploadZone";
import EmptyState from "../DashboardPage/components/EmptyState";
import dashboardWelcome from "../../assets/dashboard_welcome.webp";

const LibraryPage: React.FC = () => {
  const { materials, loading, uploading, error, handleUpload, handleDelete } = useLibrary();
  const [materialIdToDelete, setMaterialIdToDelete] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const uploadZoneRef = useRef<MaterialUploadZoneRef>(null);

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
            </Flex>

            {(error || uploadError) && (
              <Box
                $p="md"
                $bg="#fee"
                $radius="md"
                style={{ border: "1px solid #fcc", color: "#c33" }}
              >
                <Text $variant="body2">{error || uploadError}</Text>
              </Box>
            )}

            <MaterialUploadZone
              ref={uploadZoneRef}
              onUpload={handleUploadWithError}
              uploading={uploading}
            />

            <MaterialGrid materials={materials} onDelete={handleDeleteClick} />
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

