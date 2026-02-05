import React, { useEffect, useState } from "react";
import { Box, Flex, Stack, Heading, Text, Button, Badge } from "../../../design-system/primitives";
import { Modal } from "../../../design-system/patterns";
import { listMaterials, type MaterialUploadResponse } from "../../../services/materials";
import styled from "styled-components";

const MaterialItem = styled(Flex)<{ $selected: boolean }>`
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 2px solid ${({ $selected, theme }) => ($selected ? theme.colors.brand.primary : "rgba(0,0,0,0.1)")};
  background: ${({ $selected }) => ($selected ? "rgba(76, 175, 80, 0.05)" : "white")};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${({ $selected, theme }) => ($selected ? theme.colors.brand.primary : "rgba(0,0,0,0.2)")};
    background: ${({ $selected }) => ($selected ? "rgba(76, 175, 80, 0.08)" : "#f9f9f9")};
  }
`;

interface MaterialLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (materialIds: number[]) => Promise<void>;
  excludeMaterialIds?: number[];
}

const MaterialLibraryModal: React.FC<MaterialLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  excludeMaterialIds = [],
}) => {
  const [materials, setMaterials] = useState<MaterialUploadResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadMaterials();
      setSelectedIds(new Set());
    }
  }, [isOpen]);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      const list = await listMaterials();
      // Filtruj tylko gotowe materiały i wyklucz już wybrane
      const available = list.filter(
        (m) =>
          m.processing_status === "done" &&
          !excludeMaterialIds.includes(m.id)
      );
      setMaterials(available);
    } catch (err) {
      console.error("Failed to load materials", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (materialId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(materialId)) {
        next.delete(materialId);
      } else {
        next.add(materialId);
      }
      return next;
    });
  };

  const handleConfirm = async () => {
    if (selectedIds.size === 0) {
      onClose();
      return;
    }

    try {
      setSelecting(true);
      await onSelect(Array.from(selectedIds));
    } catch (err) {
      console.error("Failed to select materials", err);
    } finally {
      setSelecting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Wybierz z biblioteki"
      maxWidth={600}
      onConfirm={handleConfirm}
      confirmLabel="Dodaj wybrane"
      confirmLoading={selecting}
      cancelLabel="Anuluj"
    >
      <Stack $gap="md" style={{ maxHeight: "60vh", overflowY: "auto" }}>
        {loading ? (
          <Text $align="center">Ładowanie...</Text>
        ) : materials.length === 0 ? (
          <Text $align="center" $tone="muted">
            Brak gotowych materiałów w bibliotece
          </Text>
        ) : (
          materials.map((material) => {
            const isSelected = selectedIds.has(material.id);
            return (
              <MaterialItem
                key={material.id}
                $selected={isSelected}
                $align="center"
                $justify="space-between"
                onClick={() => toggleSelection(material.id)}
              >
                <Flex $align="center" $gap="sm" style={{ flex: 1, minWidth: 0 }}>
                  <Box>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelection(material.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Box>
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
                    {material.page_count && (
                      <Text $variant="body3" $tone="muted">
                        {material.page_count} {material.page_count === 1 ? "strona" : "stron"}
                      </Text>
                    )}
                  </Box>
                </Flex>
                <Badge $variant="success">Gotowy</Badge>
              </MaterialItem>
            );
          })
        )}
      </Stack>
      {selectedIds.size > 0 && (
        <Text $variant="body3" $tone="muted" style={{ marginTop: "12px" }}>
          Wybrano: {selectedIds.size} {selectedIds.size === 1 ? "materiał" : "materiałów"}
        </Text>
      )}
    </Modal>
  );
};

export default MaterialLibraryModal;

