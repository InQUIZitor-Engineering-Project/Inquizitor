import React from "react";
import { Heading, Stack } from "../../../design-system/primitives";
import type { FAQItem } from "../faqData.ts";
import FAQItemCard from "./FAQItemCard";

interface Props {
  category: string;
  items: FAQItem[];
  activeId: number | null;
  onToggle: (id: number) => void;
}

const FAQCategoryColumn: React.FC<Props> = ({ category, items, activeId, onToggle }) => (
  <Stack $gap="sm">
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
  </Stack>
);

export default FAQCategoryColumn;
