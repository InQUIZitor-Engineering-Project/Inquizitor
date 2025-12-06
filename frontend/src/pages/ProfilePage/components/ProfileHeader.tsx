import React from "react";
import { Flex, Stack, Heading, Text, Box, Card } from "../../../design-system/primitives";

interface ProfileHeaderProps {
  fullName?: string;
  subtitle?: string;
  illustrationSrc: string;
  error?: string | null;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ fullName, subtitle, illustrationSrc, error }) => {
  return (
    <Card $p="xl" $shadow="md" $variant="elevated">
      <Flex $align="center" $justify="space-between" $wrap="wrap" $gap="lg">
        <Stack $gap="xs" style={{ flex: "1 1 360px", minWidth: 280 }}>
          <Heading $level="h2" as="h1">
            {fullName || "Twój profil"}
          </Heading>
          <Text $variant="body2" $tone="muted">
            {subtitle}
          </Text>
          {error && (
            <Text $variant="body3" $tone="danger">
              {error}
            </Text>
          )}
        </Stack>

        <Box style={{ flex: "0 0 260px", minWidth: 200, textAlign: "right" }}>
          <Box
            as="img"
            src={illustrationSrc}
            alt="Profil"
            style={{ maxWidth: 260, width: "100%", height: "auto", objectFit: "contain" }}
          />
        </Box>
      </Flex>
    </Card>
  );
};

export default ProfileHeader;
