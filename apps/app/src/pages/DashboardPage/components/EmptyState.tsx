import React from "react";
import { Box, Button, Flex, Heading, Stack, Text } from "../../../design-system/primitives";

interface EmptyStateProps {
  illustrationSrc: string;
  illustrationAlt?: string;
  title: string;
  description?: string;
  actionLabel: string;
  onAction: () => void;
  isHub?: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  illustrationSrc,
  illustrationAlt,
  title,
  description,
  actionLabel,
  onAction,
  isHub,
}) => (
  <Flex
    $direction="column"
    $align="center"
    $justify="center"
    $gap="lg"
    $bg="transparent"
    style={{
      textAlign: "center",
      width: "100%",
      height: "100%",
      minHeight: isHub ? "calc(100dvh - 250px)" : "100%",
      padding: isHub ? 32 : undefined,
    }}
  >
    <Stack $gap="md" $align="center" style={{ maxWidth: 670 }}>
      <Box
        as="img"
        src={illustrationSrc}
        alt={illustrationAlt || title}
        style={{ width: 450, maxWidth: "100%" }}
      />
      <Heading $level="h3" as="h2">
        {title}
      </Heading>
      {description && (
        <Text $variant="body2" $tone="muted">
          {description}
        </Text>
      )}
      <Button $variant="primary" onClick={onAction} style={{ minWidth: 160 }}>
        {actionLabel}
      </Button>
    </Stack>
  </Flex>
);

export default EmptyState;
