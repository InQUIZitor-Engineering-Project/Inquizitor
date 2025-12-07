import React, { useEffect, useState } from "react";
import { Flex, Input, Text } from "../../../design-system/primitives";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

const SearchBar: React.FC<Props> = ({ value, onChange }) => {
  const [isNarrow, setIsNarrow] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 640px)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 640px)");
    const handler = (e: MediaQueryListEvent) => setIsNarrow(e.matches);
    mq.addEventListener("change", handler);
    setIsNarrow(mq.matches);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const placeholder = isNarrow
    ? "Wpisz pytanie..."
    : "Wpisz pytanie, np. „eksport do PDF”, „poziom trudności”…";

  return (
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
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ border: "none", boxShadow: "none" }}
      />
    </Flex>
  );
};

export default SearchBar;
