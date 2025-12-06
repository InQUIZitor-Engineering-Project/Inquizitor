import React from "react";
import { useTheme } from "styled-components";
import { Badge, Box, Flex, Text } from "../../../design-system/primitives";
import type { FAQItem } from "../faqData.ts";

interface Props {
  item: FAQItem;
  active: boolean;
  onToggle: () => void;
}

const FAQItemCard: React.FC<Props> = ({ item, active, onToggle }) => {
  const theme = useTheme();

  return (
    <Box
      as="button"
      onClick={onToggle}
      $bg="#fff"
      $radius="xl"
      $p="md"
      $shadow={active ? "8px" : "4px"}
      style={{
        border: "1px solid rgba(0,0,0,0.04)",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.16s ease-in-out",
      }}
    >
      <Flex $align="flex-start" $justify="space-between" $gap="sm">
        <Text as="span" $variant="body2" $weight="medium" style={{ flex: 1 }}>
          {item.question}
        </Text>
        <Badge
          $variant="neutral"
          style={{
            background: "rgba(76, 175, 80, 0.14)",
            color: theme.colors.brand.primary,
            border: "1px solid rgba(76, 175, 80, 0.35)",
          }}
        >
          {item.tag}
        </Badge>
      </Flex>
      {active && (
        <Text $variant="body3" $tone="muted" style={{ marginTop: 6 }}>
          {item.answer}
        </Text>
      )}
    </Box>
  );
};

export default FAQItemCard;
