import React from "react";
import { Box, Text, Badge } from "../../../design-system/primitives";
import type { MaterialUploadResponse } from "../../../services/materials";
import styled from "styled-components";
import { formatFileSize, formatDate, getStatusLabel, getStatusBadgeVariant } from "../utils/materialFormatters";
import MaterialFileTypeIcon from "../utils/FileTypeIcon";
import MaterialActionsMenu from "./MaterialActionsMenu";

interface MaterialListProps {
  materials: MaterialUploadResponse[];
  onDelete: (materialId: number) => void;
  onDownload: (materialId: number, filename: string) => void;
  onUseInTest: (materialId: number) => void;
  onPreview?: (material: MaterialUploadResponse) => void;
  selectedIds?: Set<number>;
  onToggleSelect?: (materialId: number) => void;
}

const TableWrapper = styled(Box)`
  width: 100%;
  overflow-x: auto;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.neutral.white};
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
`;

const Th = styled.th<{ $align?: "left" | "center" | "right" }>`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  text-align: ${({ $align = "left" }) => $align};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.neutral.dGrey};
  background: ${({ theme }) => theme.colors.tint.t5};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  white-space: nowrap;
`;

const Td = styled.td<{ $align?: "left" | "center" | "right" }>`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  text-align: ${({ $align = "left" }) => $align};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  vertical-align: middle;
`;

const Tr = styled.tr`
  &:last-child td {
    border-bottom: none;
  }
  &:hover {
    background: ${({ theme }) => theme.colors.tint.t5};
  }
`;

const IconCell = styled(Box)`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.tint.t5};
  border-radius: ${({ theme }) => theme.radii.sm};
  flex-shrink: 0;
`;

const NameCell = styled(Box)`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
`;

const ActionsCell = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CheckboxCell = styled(Td)`
  width: 40px;
  padding: ${({ theme }) => theme.spacing.xs};
`;

const RowCheckbox = styled.input.attrs({ type: "checkbox" })`
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: ${({ theme }) => theme.colors.brand.primary};
`;

const MaterialList: React.FC<MaterialListProps> = ({
  materials,
  onDelete,
  onDownload,
  onUseInTest,
  onPreview,
  selectedIds,
  onToggleSelect,
}) => {
  if (materials.length === 0) return null;

  const showSelection = !!onToggleSelect;

  return (
    <TableWrapper>
      <StyledTable>
        <thead>
          <tr>
            {showSelection && (
              <Th style={{ width: 40 }} $align="center" scope="col" aria-label="Zaznacz" />
            )}
            <Th style={{ width: 48 }} $align="center" scope="col" aria-label="Typ pliku" />
            <Th style={{ minWidth: 160 }} scope="col">
              Nazwa
            </Th>
            <Th style={{ width: 110 }} scope="col">
              Status
            </Th>
            <Th style={{ width: 72 }} $align="right" scope="col">
              Strony
            </Th>
            <Th style={{ width: 88 }} $align="right" scope="col">
              Rozmiar
            </Th>
            <Th style={{ width: 100 }} $align="right" scope="col">
              Data
            </Th>
            <Th style={{ width: 48 }} $align="center" scope="col" aria-label="Akcje" />
          </tr>
        </thead>
        <tbody>
          {materials.map((material) => (
            <Tr key={material.id}>
              {showSelection && (
                <CheckboxCell $align="center">
                  <RowCheckbox
                    checked={selectedIds?.has(material.id)}
                    onChange={() => onToggleSelect?.(material.id)}
                    aria-label={selectedIds?.has(material.id) ? "Odznacz" : "Zaznacz"}
                  />
                </CheckboxCell>
              )}
              <Td $align="center" style={{ width: 48 }}>
                <IconCell as="span" style={{ display: "inline-flex" }}>
                  <MaterialFileTypeIcon mimeType={material.mime_type} />
                </IconCell>
              </Td>
              <Td style={{ minWidth: 160 }}>
                <NameCell title={material.filename}>
                  <Text $variant="body2" $weight="medium">
                    {material.filename}
                  </Text>
                </NameCell>
              </Td>
              <Td style={{ width: 110 }}>
                <Badge $variant={getStatusBadgeVariant(material.processing_status)}>
                  {getStatusLabel(material.processing_status)}
                </Badge>
              </Td>
              <Td $align="right" style={{ width: 72 }}>
                <Text $variant="body3" $tone="muted">
                  {material.page_count ?? "—"}
                </Text>
              </Td>
              <Td $align="right" style={{ width: 88 }}>
                <Text $variant="body3" $tone="muted">
                  {formatFileSize(material.size_bytes)}
                </Text>
              </Td>
              <Td $align="right" style={{ width: 100 }}>
                <Text $variant="body3" $tone="muted">
                  {formatDate(material.created_at)}
                </Text>
              </Td>
              <Td $align="center" style={{ width: 48 }}>
                <ActionsCell>
                  <MaterialActionsMenu
                    material={material}
                    onDownload={onDownload}
                    onUseInTest={onUseInTest}
                    onDelete={onDelete}
                    onPreview={onPreview}
                  />
                </ActionsCell>
              </Td>
            </Tr>
          ))}
        </tbody>
      </StyledTable>
    </TableWrapper>
  );
};

export default MaterialList;
