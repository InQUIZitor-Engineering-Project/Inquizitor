import React, { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import styled from "styled-components";
import { Flex, Stack, Heading, Text, Box, Button } from "../../design-system/primitives";
import { PageContainer, PageSection, Modal } from "../../design-system/patterns";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import useLibrary from "./hooks/useLibrary";
import MaterialGrid from "./components/MaterialGrid";
import MaterialList from "./components/MaterialList";
import RenameMaterialModal from "./components/RenameMaterialModal";
import LibraryToolbar, { type ViewMode } from "./components/LibraryToolbar";
import MaterialUploadZone, { type MaterialUploadZoneRef } from "../../components/MaterialUploadZone/MaterialUploadZone";
import EmptyState from "../DashboardPage/components/EmptyState";
import dashboardWelcome from "../../assets/dashboard_welcome.webp";
import { getMaterialFileBlobUrl, downloadMaterial, updateMaterial, type MaterialUploadResponse } from "../../services/materials";
import {
  filterAndSortMaterials,
  DEFAULT_FILTER_STATE,
  filterStateToSearchParams,
  searchParamsToFilterState,
  type LibraryFilterState,
} from "./utils/libraryFilters";

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

const EmptyFiltersState = styled(Box)`
  width: 100%;
  box-sizing: border-box;
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl};
  background: ${({ theme }) => theme.colors.neutral.white};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.neutral.greyBlue};
`;

const VIEW_MODE_KEY = "materials_library_view";

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
  const [searchParams, setSearchParams] = useSearchParams();
  const { materials, loading, uploading, error, handleUpload, handleDelete, refresh } = useLibrary();
  const [materialIdToDelete, setMaterialIdToDelete] = useState<number | null>(null);
  const [bulkDeleteIds, setBulkDeleteIds] = useState<number[] | null>(null);
  const [materialToRename, setMaterialToRename] = useState<MaterialUploadResponse | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(getStoredViewMode);
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<Set<number>>(new Set());
  const [filterState, setFilterState] = useState<LibraryFilterState>(() =>
    searchParamsToFilterState(searchParams)
  );
  const uploadZoneRef = useRef<MaterialUploadZoneRef>(null);

  useEffect(() => {
    const params = filterStateToSearchParams(filterState);
    setSearchParams(params, { replace: true });
  }, [filterState, setSearchParams]);

  const filteredAndSortedMaterials = useMemo(
    () => filterAndSortMaterials(materials, filterState),
    [materials, filterState]
  );

  const clearFilters = useCallback(() => {
    setFilterState(DEFAULT_FILTER_STATE);
  }, []);

  const handleFilterChange = useCallback((patch: Partial<LibraryFilterState>) => {
    setFilterState((prev) => ({ ...prev, ...patch }));
  }, []);

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

  const handleBulkUseInTest = useCallback(() => {
    const ids = Array.from(selectedMaterialIds);
    if (ids.length === 0) return;
    navigate(`/tests/new/ai?materialIds=${ids.join(",")}`);
  }, [navigate, selectedMaterialIds]);

  const handleViewModeChange = useCallback((v: ViewMode) => {
    setViewMode(v);
    try {
      localStorage.setItem(VIEW_MODE_KEY, v);
    } catch {
      /* ignore */
    }
  }, []);

  const handleRenameSave = useCallback(
    async (materialId: number, newFilename: string) => {
      await updateMaterial(materialId, { filename: newFilename });
      await refresh();
    },
    [refresh]
  );

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

  const closeBulkDeleteModal = () => setBulkDeleteIds(null);

  const toggleSelection = useCallback((id: number) => {
    setSelectedMaterialIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedMaterialIds(new Set()), []);

  const handleBulkDownload = useCallback(async () => {
    const list = filteredAndSortedMaterials.filter((m) => selectedMaterialIds.has(m.id));
    try {
      setUploadError(null);
      for (const m of list) {
        await downloadMaterial(m.id, m.filename);
      }
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Nie udało się pobrać plików");
    }
  }, [filteredAndSortedMaterials, selectedMaterialIds]);

  const handleBulkDelete = useCallback(() => {
    setBulkDeleteIds(Array.from(selectedMaterialIds));
  }, [selectedMaterialIds]);

  const confirmBulkDelete = async () => {
    if (!bulkDeleteIds?.length) return;
    try {
      for (const id of bulkDeleteIds) {
        await handleDelete(id);
      }
      setSelectedMaterialIds(new Set());
    } catch (err: any) {
      alert("Nie udało się usunąć materiałów: " + (err?.message || err));
    } finally {
      closeBulkDeleteModal();
    }
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
            <Heading as="h1" $level="h2">
              Biblioteka materiałów
            </Heading>

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

            <LibraryToolbar
              filterState={filterState}
              onFilterChange={handleFilterChange}
              onClearFilters={clearFilters}
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
              selectedCount={selectedMaterialIds.size}
              onBulkDownload={handleBulkDownload}
              onBulkDelete={handleBulkDelete}
              onBulkUseInTest={handleBulkUseInTest}
              onClearSelection={clearSelection}
            />

            {filteredAndSortedMaterials.length === 0 ? (
              <EmptyFiltersState>
                <Box $mb="md">
                  <Text $tone="muted">
                    Brak wyników dla podanych filtrów. Zmień kryteria lub wyczyść filtry.
                  </Text>
                </Box>
                <Button $variant="outline" $size="md" onClick={clearFilters}>
                  Wyczyść filtry
                </Button>
              </EmptyFiltersState>
            ) : viewMode === "grid" ? (
              <MaterialGrid
                materials={filteredAndSortedMaterials}
                onDelete={handleDeleteClick}
                onDownload={handleDownload}
                onUseInTest={handleUseInTest}
                onPreview={handlePreview}
                onRename={(m) => setMaterialToRename(m)}
                selectedIds={selectedMaterialIds}
                onToggleSelect={toggleSelection}
              />
            ) : (
              <MaterialList
                materials={filteredAndSortedMaterials}
                onDelete={handleDeleteClick}
                onDownload={handleDownload}
                onUseInTest={handleUseInTest}
                onPreview={handlePreview}
                onRename={(m) => setMaterialToRename(m)}
                selectedIds={selectedMaterialIds}
                onToggleSelect={toggleSelection}
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

      {bulkDeleteIds !== null && bulkDeleteIds.length > 0 && (
        <Modal
          isOpen={true}
          title="Usuń materiały"
          onClose={closeBulkDeleteModal}
          onConfirm={confirmBulkDelete}
          variant="danger"
          confirmLabel="Usuń"
        >
          Czy na pewno chcesz usunąć {bulkDeleteIds.length} materiałów? Tej operacji nie można cofnąć.
        </Modal>
      )}

      <RenameMaterialModal
        material={materialToRename}
        onClose={() => setMaterialToRename(null)}
        onSave={handleRenameSave}
      />
    </Flex>
  );
};

export default LibraryPage;

