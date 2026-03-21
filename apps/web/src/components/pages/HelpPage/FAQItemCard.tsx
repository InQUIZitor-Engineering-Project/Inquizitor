"use client";
import React from "react";
import { useTheme } from "styled-components";
import { Badge, Box, Flex, Text } from "@inquizitor/ui";
import type { FAQItem } from "./faqData";

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
      $bg={theme.colors.neutral.white}
      $radius="xl"
      $p="md"
      $shadow={active ? "8px" : "4px"}
      style={{
        border: `1px solid ${active ? theme.colors.brand.primary : theme.colors.neutral.greyBlue}`,
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
        transition: "all 0.16s ease-in-out",
      }}
    >
      <Flex $align="flex-start" $justify="space-between" $gap="sm" $wrap="wrap">
        <Text
          as="span"
          $variant="body2"
          $weight="medium"
          $tone="default"
          style={{
            flex: 1,
            minWidth: 0,
            overflowWrap: "break-word",
            wordBreak: "break-word",
          }}
        >
          {item.question}
        </Text>
        <Badge
          $variant="neutral"
          style={{
            background: theme.colors.tint.t5,
            color: theme.colors.brand.primary,
            border: `1px solid ${theme.colors.brand.primary}`,
            flexShrink: 0,
          }}
        >
          {item.tag}
        </Badge>
      </Flex>
      {active && (
        <Text
          $variant="body3"
          $tone="default"
          style={{
            marginTop: 12,
            borderTop: `1px solid ${theme.colors.neutral.greyBlue}`,
            paddingTop: 12,
            color: theme.colors.neutral.dGrey,
          }}
        >
          {item.answer}
        </Text>
      )}
    </Box>
  );
};

export default FAQItemCard;
