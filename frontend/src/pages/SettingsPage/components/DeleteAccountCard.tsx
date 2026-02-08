import React, { useState } from "react";
import { Card, Stack, Heading, Text, Button, Divider, Input, Flex } from "../../../design-system/primitives";
import { Modal } from "../../../design-system/patterns";

interface DeleteAccountCardProps {
  onDelete: () => Promise<void>;
  loading?: boolean;
}

const DeleteAccountCard: React.FC<DeleteAccountCardProps> = ({
  onDelete,
  loading,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleClose = () => {
    setIsModalOpen(false);
    setConfirmText("");
  };

  const isConfirmed = confirmText === "Potwierdzam";

  return (
    <Card $p="lg" $shadow="md" $variant="elevated" style={{ borderColor: "#fee2e2" }}>
      <Stack $gap="md">
        <Stack $gap="4px">
          <Heading $level="h3" style={{ color: "#b91c1c" }}>Usuń konto</Heading>
          <Text $variant="body3" $tone="muted">
            Pamiętaj, że ta operacja jest nieodwracalna. Wszystkie Twoje testy i materiały zostaną trwale usunięte.
          </Text>
        </Stack>

        <Divider />

        <Button 
          $variant="outline" 
          onClick={() => setIsModalOpen(true)}
          style={{ color: "#b91c1c", borderColor: "#b91c1c" }}
        >
          Usuń moje konto
        </Button>
      </Stack>

      <Modal
        isOpen={isModalOpen}
        title="Czy na pewno chcesz usunąć konto?"
        onClose={handleClose}
        maxWidth={480}
        confirmLabel="Tak, usuń konto"
        cancelLabel="Anuluj"
        onConfirm={onDelete}
        confirmLoading={loading}
        variant="danger"
        footer={
          <Flex $justify="flex-end" $gap="sm" $wrap="wrap" $mt="md">
            <Button $variant="outline" onClick={handleClose} disabled={loading}>
              Anuluj
            </Button>
            <Button
              $variant="danger"
              onClick={onDelete}
              disabled={loading || !isConfirmed}
            >
              Tak, usuń konto
            </Button>
          </Flex>
        }
      >
        <Stack $gap="md">
          <Text $variant="body2">
            Wszystkie Twoje dane, w tym wygenerowane testy i przesłane materiały, zostaną trwale usunięte z naszego systemu.
          </Text>
          <Text $variant="body2" $weight="medium">
            Nie będziesz mógł cofnąć tej operacji.
          </Text>
          
          <Stack $gap="xs" $mt="md">
            <Text $variant="body3" $weight="medium">
              Aby kontynuować, wpisz: <Text as="span" $weight="medium" style={{ color: "#b91c1c" }}>Potwierdzam</Text>
            </Text>
            <Input
              $fullWidth
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Wpisz tutaj..."
              autoFocus
            />
          </Stack>
        </Stack>
      </Modal>
    </Card>
  );
};

export default DeleteAccountCard;
