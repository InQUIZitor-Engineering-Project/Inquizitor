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
  background: ${({ $bg, theme }) => $bg || theme.colors.tint.t5};
  color: ${({ $fg, theme }) => $fg || theme.colors.neutral.dGrey};
  white-space: nowrap;
  border: 1px solid ${({ theme }) => theme.colors.neutral.greyBlue};
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
