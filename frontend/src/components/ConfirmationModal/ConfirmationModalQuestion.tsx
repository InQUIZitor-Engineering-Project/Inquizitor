import React from "react";
import { Button, Box, Flex, Text, Heading } from "../../design-system/primitives";

export interface ConfirmationModalProps {
  onCancel: () => void;
  onConfirm: () => void;
}

const ConfirmationModalQuestion: React.FC<ConfirmationModalProps> = ({
  onCancel,
  onConfirm,
}) => {
  return (
    <Box
      $display="flex"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(4px)",
        zIndex: 1000,
        padding: 16,
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onCancel}
    >
      <Box
        $bg="#fff"
        $radius="lg"
        $shadow="md"
        $p="lg"
        style={{
          width: "100%",
          maxWidth: 600,
          maxHeight: "90vh",
          boxSizing: "border-box",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Heading $level="h3" as="h3" style={{ marginBottom: 8 }}>
          Czy na pewno usunąć?
        </Heading>
        <Text $variant="body3" $tone="muted" style={{ marginBottom: 16 }}>
          Tej operacji nie można cofnąć.
        </Text>
        <Flex $justify="flex-end" $gap="sm" $wrap="wrap">
          <Button $variant="outline" $size="lg" onClick={onCancel}>
            Anuluj
          </Button>

          <Button $variant="danger" $size="lg" onClick={onConfirm}>
            Usuń
          </Button>
        </Flex>
      </Box>
    </Box>
  );
};

export default ConfirmationModalQuestion;