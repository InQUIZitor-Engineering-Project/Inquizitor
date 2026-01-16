import React from "react";
import { Flex, Box, Text } from "../../../design-system/primitives";
import { Badge } from "../../../design-system/primitives/Badge";

export interface MetaSummaryProps {
  total: number;
  easy: number;
  medium: number;
  hard: number;
}

const MetaSummary: React.FC<MetaSummaryProps> = ({
  total,
  easy,
  medium,
  hard,
}) => {
  // Uniwersalna funkcja do polskiej odmiany
  const getPlural = (n: number, forms: [string, string, string]) => {
    const [singular, pluralNominative, pluralGenitive] = forms;

    if (n === 1) return singular;

    const lastDigit = n % 10;
    const lastTwoDigits = n % 100;

    if (lastTwoDigits >= 12 && lastTwoDigits <= 14) {
      return pluralGenitive;
    }

    if (lastDigit >= 2 && lastDigit <= 4) {
      return pluralNominative;
    }

    return pluralGenitive;
  };

  return (
    <Flex $align="center" $gap="sm" $wrap="wrap">
      <Flex $align="center" $gap="xs">
        <Badge $variant="neutral">{total}</Badge>
        <Text $variant="body4" $weight="medium" $tone="muted" $uppercase>
          {getPlural(total, ["PYTANIE", "PYTANIA", "PYTAŃ"])}
        </Text>
      </Flex>

      <Box $width="1px" $height="16px" $bg="#abbed1" $mx="xs" />

      <Flex $align="center" $gap="xs">
        {easy > 0 && (
          <Badge $variant="success" $pill={false}>
            {easy} {getPlural(easy, ["ŁATWE", "ŁATWE", "ŁATWYCH"])}
          </Badge>
        )}
        {medium > 0 && (
          <Badge $variant="warning" $pill={false}>
            {medium} {getPlural(medium, ["ŚREDNIE", "ŚREDNIE", "ŚREDNICH"])}
          </Badge>
        )}
        {hard > 0 && (
          <Badge $variant="danger" $pill={false}>
            {hard} {getPlural(hard, ["TRUDNE", "TRUDNE", "TRUDNYCH"])}
          </Badge>
        )}
      </Flex>
    </Flex>
  );
};

export default MetaSummary;