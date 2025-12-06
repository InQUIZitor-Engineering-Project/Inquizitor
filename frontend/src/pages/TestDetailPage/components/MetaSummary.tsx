import React from "react";
import { Flex, Text } from "../../../design-system/primitives";

export interface MetaSummaryProps {
  total: number;
  easy: number;
  medium: number;
  hard: number;
  closedCount: number;
  openCount: number;
}

const MetaSummary: React.FC<MetaSummaryProps> = ({ total, easy, medium, hard, closedCount, openCount }) => {
  return (
    <Flex $align="center" $justify="space-between" $gap="md" $wrap="wrap">
      <Text $variant="body3" $tone="muted">
        {total} pytań | {easy} łatwe, {medium} średnie, {hard} trudne |{" "}
        {closedCount > 0 && openCount > 0
          ? `Mieszane (${closedCount} zamkniętych, ${openCount} otwartych)`
          : closedCount === total
          ? "Zamknięte"
          : "Otwarte"}
      </Text>
    </Flex>
  );
};

export default MetaSummary;
