import React from "react";
import { Box, Text } from "../../design-system/primitives";

const Footer: React.FC = () => {
  return (
    <Box as="footer" $bg="#f5f6f8" $py="sm" $px="md" style={{ marginTop: 20 }}>
      <Text $variant="body4" $tone="muted" $align="center">
        © 2026 Inquizitor. Wszelkie prawa zastrzeżone.
      </Text>
    </Box>
  );
};

export default Footer;
