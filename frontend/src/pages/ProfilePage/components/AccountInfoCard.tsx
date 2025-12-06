import React from "react";
import { Card, Stack, Heading, Flex, Text } from "../../../design-system/primitives";
import InfoTile from "./InfoTile";

interface AccountInfoCardProps {
  firstName?: string;
  lastName?: string;
  email?: string;
  userId?: number;
}

const AccountInfoCard: React.FC<AccountInfoCardProps> = ({ firstName, lastName, email, userId }) => (
  <Card $p="lg" $shadow="md" $variant="elevated">
    <Stack $gap="md">
      <Heading $level="h3">Dane konta</Heading>
      <Text $variant="body3" $tone="muted">
        To są podstawowe informacje powiązane z Twoim kontem.
      </Text>
      <Flex $gap="lg" $wrap="wrap">
        <InfoTile label="Imię i nazwisko" value={`${firstName || ""} ${lastName || ""}`.trim() || "—"} />
        <InfoTile label="Adres e-mail" value={email} />
        <InfoTile label="ID użytkownika" value={userId} />
      </Flex>
    </Stack>
  </Card>
);

export default AccountInfoCard;
