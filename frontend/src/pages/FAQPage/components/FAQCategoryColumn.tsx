import React from "react";
import { Heading, Stack } from "../../../design-system/primitives";
import styled from "styled-components";
import type { FAQItem } from "../faqData.ts";
import FAQItemCard from "./FAQItemCard";

const ColumnStack = styled(Stack)`
  width: 100%;
  max-width: 520px;
  margin: 0 auto;

  ${({ theme }) => theme.media.down("md")} {
    max-width: 560px;
  }
`;

interface Props {
  category: string;
  items: FAQItem[];
  activeId: number | null;
  onToggle: (id: number) => void;
}

const FAQCategoryColumn: React.FC<Props> = ({ category, items, activeId, onToggle }) => (
  <ColumnStack $gap="sm">
    <Heading $level="h4" as="h2">
      {category}
    </Heading>
    <Stack $gap="sm">
      {items.map((item) => (
        <FAQItemCard
          key={item.id}
          item={item}
          active={item.id === activeId}
          onToggle={() => onToggle(item.id)}
        />
      ))}
    </Stack>
  </ColumnStack>
);

export default FAQCategoryColumn;
