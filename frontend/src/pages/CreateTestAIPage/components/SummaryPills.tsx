import React from "react";
import styled from "styled-components";
import { Flex, Text } from "../../../design-system/primitives";

export interface SummaryItem {
  label: string;
  value: React.ReactNode;
  bg: string;
  fg: string;
}

export interface SummaryPillsProps {
  items: SummaryItem[];
}

const Pill = styled.span<{ $bg?: string; $fg?: string }>`
  padding: 6px 12px;
  border-radius: 999px;
  font-weight: 600;
  font-size: 12px;
  background: ${({ $bg }) => $bg || "rgba(0,0,0,.06)"};
  color: ${({ $fg }) => $fg || "#333"};
  white-space: nowrap;
`;

const SummaryPills: React.FC<SummaryPillsProps> = ({ items }) => {
  return (
    <Flex $gap="xs" $wrap="wrap">
      {items.map((item) => (
        <Pill key={item.label} $bg={item.bg} $fg={item.fg}>
          <Text as="span" $variant="body3" $weight="medium">
            {item.label}: {item.value}
          </Text>
        </Pill>
      ))}
    </Flex>
  );
};

export default SummaryPills;
