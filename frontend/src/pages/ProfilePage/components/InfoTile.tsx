import React from "react";
import { Box, Stack, Text } from "../../../design-system/primitives";

interface InfoTileProps {
  label: string;
  value?: React.ReactNode;
  helper?: string;
  bg?: string;
  valueColor?: string;
}

const InfoTile: React.FC<InfoTileProps> = ({ label, value, helper, bg, valueColor }) => (
  <Box $bg={bg || (({ theme }) => theme.colors.tint.t5)} $radius="md" $p="md" style={{ minWidth: 160, flex: "1 1 200px" }}>
    <Stack $gap="4px">
      <Text $variant="body3" $tone="muted" style={{ textTransform: "uppercase" }}>
        {label}
      </Text>
      <Text $variant="body1" $weight="medium" style={{ color: valueColor || (({ theme }) => theme.colors.brand.primary) }}>
        {value || "—"}
      </Text>
      {helper && (
        <Text $variant="body3" >
          {helper}
        </Text>
      )}
    </Stack>
  </Box>
);

export default InfoTile;
