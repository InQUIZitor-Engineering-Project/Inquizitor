"use client";
import React from "react";
import { useTheme } from "styled-components";
import { Flex, Input, Text } from "@inquizitor/ui";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

const SearchBar: React.FC<Props> = ({ value, onChange }) => {
  const theme = useTheme();
  return (
    <Flex
      $align="center"
      $gap="sm"
      $bg={theme.colors.neutral.white}
      $radius="pill"
      $shadow="md"
      $px="md"
      $py="sm"
      style={{ maxWidth: 520, width: "100%" }}
    >
      <Text as="span" $variant="body2" $tone="subtle" style={{ fontSize: 16 }}>
        🔍
      </Text>
      <Input
        $fullWidth
        $size="md"
        placeholder="Wpisz pytanie..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ border: "none", boxShadow: "none" }}
      />
    </Flex>
  );
};

export default SearchBar;
