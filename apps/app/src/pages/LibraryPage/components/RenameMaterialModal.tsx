import React, { useState, useEffect } from "react";
import { Modal } from "../../../design-system/patterns";
import { Input, Button, Flex, Text } from "../../../design-system/primitives";
import type { MaterialUploadResponse } from "../../../services/materials";

interface RenameMaterialModalProps {
  material: MaterialUploadResponse | null;
  onClose: () => void;
  onSave: (materialId: number, newFilename: string) => Promise<void>;
}

const RenameMaterialModal: React.FC<RenameMaterialModalProps> = ({
  material,
  onClose,
  onSave,
}) => {
  const [filename, setFilename] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (material) {
      setFilename(material.filename || "");
      setError(null);
    }
  }, [material]);

  if (!material) return null;

  const handleSubmit = async () => {
    const trimmed = filename.trim();
    if (!trimmed) {
      setError("Nazwa pliku nie może być pusta");
      return;
    }
    if (trimmed === material.filename) {
      onClose();
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSave(material.id, trimmed);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się zmienić nazwy");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      title="Zmień nazwę pliku"
      onClose={onClose}
      footer={
        <Flex $gap="sm" $align="center">
          <Button $variant="outline" onClick={onClose} disabled={saving}>
            Anuluj
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Zapisywanie…" : "Zapisz"}
          </Button>
        </Flex>
      }
    >
      <Flex $direction="column" $align="center" $gap="sm" style={{ width: "100%" }}>
        <Input
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          placeholder="Nazwa pliku"
          disabled={saving}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          aria-label="Nazwa pliku"
          style={{ width: "100%", boxSizing: "border-box" }}
        />
        {error && (
          <Text $variant="body3" $tone="danger" style={{ alignSelf: "flex-start" }}>
            {error}
          </Text>
        )}
      </Flex>
    </Modal>
  );
};

export default RenameMaterialModal;
