import React from "react";
import { Box } from "../../../design-system/primitives";
import styled from "styled-components";
import MaterialCard from "./MaterialCard";
import type { MaterialUploadResponse } from "../../../services/materials";

interface MaterialGridProps {
  materials: MaterialUploadResponse[];
  onDelete: (materialId: number) => void;
  onDownload: (materialId: number, filename: string) => void;
  onUseInTest: (materialId: number) => void;
  onPreview?: (material: MaterialUploadResponse) => void;
}

/* Responsive grid: mobile 2 cols, tablet 3–4, desktop (≥1200) 5–6 cols; uniform card height per row */
const Grid = styled(Box)`
  display: grid;
  align-items: stretch;

  /* Mobile: 2 columns, moderate gap */
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => theme.spacing.md};

  /* Tablet (≥768px): 3–4 columns */
  ${({ theme }) => theme.media.up("md")} {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: ${({ theme }) => theme.spacing.md};
  }

  /* Desktop (≥1200px): 5–6 columns, slightly larger gap */
  @media (min-width: 1200px) {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: ${({ theme }) => theme.spacing.lg};
  }
`;

const MaterialGrid: React.FC<MaterialGridProps> = ({
  materials,
  onDelete,
  onDownload,
  onUseInTest,
  onPreview,
}) => {
  if (materials.length === 0) return null;

  return (
    <Grid>
      {materials.map((material) => (
        <MaterialCard
          key={material.id}
          material={material}
          onDelete={onDelete}
          onDownload={onDownload}
          onUseInTest={onUseInTest}
          onPreview={onPreview}
        />
      ))}
    </Grid>
  );
};

export default MaterialGrid;

