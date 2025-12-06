import React from "react";
import { Flex, Stack, Button, Textarea, Select, Divider, Text } from "../../../design-system/primitives";
import { ChoiceEditor, AlertBar } from "../../../design-system/patterns";
import SegmentedToggle from "../../../design-system/patterns/SegmentedToggle";
import type { QuestionOut } from "../../../services/test";

export interface QuestionEditorProps {
  draft: Partial<QuestionOut>;
  missingCorrectLive: boolean;
  editorError: string | null;
  saving: boolean;
  onToggleClosed: (closed: boolean) => void;
  onSetDifficulty: (value: number) => void;
  onTextChange: (value: string) => void;
  onChangeChoice: (index: number, value: string) => void;
  onToggleCorrect: (value: string, checked: boolean) => void;
  onRemoveChoice: (index: number) => void;
  onAddChoice: () => void;
  onSave: () => void;
  onCancel: () => void;
  ensureChoices: (choices?: string[] | null) => string[];
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({
  draft,
  missingCorrectLive,
  editorError,
  saving,
  onToggleClosed,
  onSetDifficulty,
  onTextChange,
  onChangeChoice,
  onToggleCorrect,
  onRemoveChoice,
  onAddChoice,
  onSave,
  onCancel,
  ensureChoices,
}) => {
  const isClosed = !!draft.is_closed;

  return (
    <Stack $gap="md">
      <Flex $gap="sm" $align="center" $justify="space-between" $wrap="wrap">
        <SegmentedToggle
          options={[
            { label: "Zamknięte", value: "closed" },
            { label: "Otwarte", value: "open" },
          ]}
          value={isClosed ? "closed" : "open"}
          onChange={(v) => onToggleClosed(v === "closed")}
        />

        <Select
          value={draft.difficulty || 1}
          onChange={(e) => onSetDifficulty(Number(e.target.value))}
          aria-label="Poziom trudności"
        >
          <option value={1}>Łatwe</option>
          <option value={2}>Średnie</option>
          <option value={3}>Trudne</option>
        </Select>
      </Flex>

      <Textarea
        $fullWidth
        $minHeight="140px"
        value={draft.text || ""}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder="Wpisz treść pytania…"
      />

      <Divider />

      {isClosed ? (
        <>
          <ChoiceEditor
            items={ensureChoices(draft.choices).map((choice) => {
              const value = choice ?? "";
              return {
                value,
                isCorrect: (draft.correct_choices || []).includes(value),
              };
            })}
            onChange={(index, value) => onChangeChoice(index, value)}
            onToggleCorrect={(index, next) => {
              const currentValue = ensureChoices(draft.choices)[index] ?? "";
              onToggleCorrect(currentValue, next);
            }}
            onRemove={(index) => onRemoveChoice(index)}
            onAdd={onAddChoice}
            addLabel="+ Dodaj odpowiedź"
          />

          <Text $variant="body4" $tone="muted" style={{ fontStyle: "italic" }}>
            Zaznacz przynajmniej jedną poprawną odpowiedź, aby zapisać pytanie zamknięte.
          </Text>
        </>
      ) : (
        <Text $variant="body4" $tone="muted" style={{ fontStyle: "italic" }}>
          Pytanie otwarte — odpowiedź udzielana przez zdającego.
        </Text>
      )}

      {missingCorrectLive && !editorError && (
        <AlertBar variant="danger">Zaznacz przynajmniej jedną poprawną odpowiedź.</AlertBar>
      )}
      {editorError && <AlertBar variant="danger">{editorError}</AlertBar>}

      <Flex $gap="sm" $justify="flex-end" $wrap="wrap">
        <Button onClick={onSave} disabled={saving}>
          Zapisz
        </Button>
        <Button $variant="danger" onClick={onCancel}>
          Anuluj
        </Button>
      </Flex>
    </Stack>
  );
};

export default QuestionEditor;
