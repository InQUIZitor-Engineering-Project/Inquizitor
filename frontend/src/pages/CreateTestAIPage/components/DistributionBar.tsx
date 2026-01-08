import React from "react";
import styled from "styled-components";
import { PALETTE } from "../constants";

export interface DistributionBarProps {
  easyPct: number;
  medPct: number;
  hardPct: number;
  disabled?: boolean;
}

const Bar = styled.div<{ $disabled?: boolean }>`
  position: relative;
  height: 12px;
  border-radius: 999px;
  background: #eef4ee;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  display: flex;
  gap: 0;
  opacity: ${({ $disabled }) => ($disabled ? 0.6 : 1)};
`;

const Segment = styled.div<{ $w: number; $bg: string }>`
  flex: 0 0 ${({ $w }) => Math.max(0, Math.min($w, 100))}%;
  background: ${({ $bg }) => $bg};
  transition: flex-basis 220ms ease;
`;

const DistributionBar: React.FC<DistributionBarProps> = ({ easyPct, medPct, hardPct, disabled }) => {
  return (
    <Bar aria-label="Rozkład trudności" $disabled={disabled}>
      <Segment $w={disabled ? 0 : easyPct} $bg={PALETTE.diff.easyBg} />
      <Segment $w={disabled ? 0 : medPct} $bg={PALETTE.diff.medBg} />
      <Segment $w={disabled ? 0 : hardPct} $bg={PALETTE.diff.hardBg} />
    </Bar>
  );
};

export default DistributionBar;
