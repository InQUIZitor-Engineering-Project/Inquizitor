import React from "react";
import { Flex, Stack, Heading, Text, Box, Card } from "../../../design-system/primitives";

interface ProfileHeaderProps {
  fullName?: string;
  subtitle?: string;
  illustrationSrc: string;
  illustrationAlt?: string;
  error?: string | null;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ fullName, subtitle, illustrationSrc, illustrationAlt, error }) => {
  return (
    <Card $p="lg" $shadow="sm" $variant="elevated" $bg={((props: any) => props.theme.colors.neutral.white)}>
      <Flex $align="center" $justify="space-between" $wrap="wrap" $gap="md">
        <Stack $gap="xs" style={{ flex: "1 1 300px", minWidth: 240 }}>
          <Heading $level="h3" as="h1">
            {fullName || "Twój profil"}
          </Heading>
          <Text $variant="body3" $tone="muted">
            {subtitle}
          </Text>
          {error && (
            <Text $variant="body4" $tone="danger">
              {error}
            </Text>
          )}
        </Stack>

        <Box style={{ flex: "0 0 180px", minWidth: 140, textAlign: "right" }}>
          <Box
            as="img"
            src={illustrationSrc}
            alt={illustrationAlt || "Ilustracja profilu"}
            style={{ maxWidth: 180, width: "100%", height: "auto", objectFit: "contain" }}
          />
        </Box>
      </Flex>
    </Card>
  );
};

export default ProfileHeader;
