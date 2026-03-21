import React from "react";
import { Card, Stack, Heading, Text, Input, Button, Divider } from "../../../design-system/primitives";

interface PasswordCardProps {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
  onOldChange: (v: string) => void;
  onNewChange: (v: string) => void;
  onConfirmChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  error?: string | null;
  success?: string | null;
}

const PasswordCard: React.FC<PasswordCardProps> = ({
  oldPassword,
  newPassword,
  confirmPassword,
  onOldChange,
  onNewChange,
  onConfirmChange,
  onSubmit,
  error,
  success,
}) => {
  return (
    <Card as="form" onSubmit={onSubmit} $p="lg" $shadow="md" $variant="elevated">
      <Stack $gap="md">
        <Stack $gap="4px">
          <Heading $level="h3">Zmień hasło</Heading>
          <Text $variant="body3" $tone="muted">
            Użyj silnego, unikalnego hasła, aby zabezpieczyć swoje konto.
          </Text>
        </Stack>

        <Stack $gap="xs">
          <Text as="label" htmlFor="oldPassword" $variant="body3" $tone="muted">
            Aktualne hasło
          </Text>
          <Input
            id="oldPassword"
            type="password"
            $fullWidth
            value={oldPassword}
            onChange={(e) => onOldChange(e.target.value)}
            placeholder="Wpisz aktualne hasło"
          />
        </Stack>

        <Stack $gap="xs">
          <Text as="label" htmlFor="newPassword" $variant="body3" $tone="muted">
            Nowe hasło
          </Text>
          <Input
            id="newPassword"
            type="password"
            $fullWidth
            value={newPassword}
            onChange={(e) => onNewChange(e.target.value)}
            placeholder="Minimum 8 znaków"
          />
        </Stack>

        <Stack $gap="xs">
          <Text as="label" htmlFor="confirmPassword" $variant="body3" $tone="muted">
            Powtórz nowe hasło
          </Text>
          <Input
            id="confirmPassword"
            type="password"
            $fullWidth
            value={confirmPassword}
            onChange={(e) => onConfirmChange(e.target.value)}
            placeholder="Powtórz nowe hasło"
          />
        </Stack>

        <Divider />

        <Button type="submit" $size="lg" >
          Zapisz nowe hasło
        </Button>

        {error && (
          <Text $variant="body3" $tone="danger">
            {error}
          </Text>
        )}
        {success && (
          <Text $variant="body3" $tone="success">
            {success}
          </Text>
        )}
      </Stack>
    </Card>
  );
};

export default PasswordCard;
