import React from "react";
import { Box } from "../../../design-system/primitives";
import styled from "styled-components";
import MaterialCard from "./MaterialCard";
import type { MaterialUploadResponse } from "../../../services/materials";

interface MaterialGridProps {
  materials: MaterialUploadResponse[];
  onDelete: (materialId: number) => void;
}

const Grid = styled(Box)`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  align-items: start;

  ${({ theme }) => theme.media.down("md")} {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const MaterialGrid: React.FC<MaterialGridProps> = ({ materials, onDelete }) => {
  if (materials.length === 0) {
    return null;
  }

  return (
    <Grid>
      {materials.map((material) => (
        <MaterialCard key={material.id} material={material} onDelete={onDelete} />
      ))}
    </Grid>
  );
};

export default MaterialGrid;

