import React from "react";
import { Flex, Input, Text } from "../../../design-system/primitives";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

const SearchBar: React.FC<Props> = ({ value, onChange }) => (
  <Flex
    $align="center"
    $gap="sm"
    $bg="#fff"
    $radius="pill"
    $shadow="md"
    $px="md"
    $py="sm"
    style={{ maxWidth: 520 }}
  >
    <Text as="span" $variant="body2" $tone="subtle" style={{ fontSize: 16 }}>
      🔍
    </Text>
    <Input
      $fullWidth
      $size="md"
      placeholder="Wpisz pytanie, np. „eksport do PDF”, „poziom trudności”…"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ border: "none", boxShadow: "none" }}
    />
  </Flex>
);

export default SearchBar;
