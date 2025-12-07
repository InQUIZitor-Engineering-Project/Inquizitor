import React from "react";
import { Box, Button, Flex, Stack, Text } from "../../../design-system/primitives";
import { QuestionCard } from "../../../design-system/patterns";
import QuestionView from "./QuestionView";
import QuestionEditor from "./QuestionEditor";
import type { QuestionOut } from "../../../services/test";
import { MathText } from "../../../components/MathText/MathText";

export interface QuestionsSectionProps {
  questions: QuestionOut[];
  editingId: number | null;
  isAdding: boolean;
  draft: Partial<QuestionOut>;
  actions: {
    startEdit: (q: QuestionOut) => void;
    startAdd: () => void;
    cancelEdit: () => void;
    handleSaveEdit: () => Promise<void>;
    handleAdd: () => Promise<void>;
    handleDelete: (qid: number) => Promise<void>;
    toggleDraftClosed: (closed: boolean) => void;
    setDraftDifficulty: (value: number) => void;
    onTextChange: (value: string) => void;
    updateDraftChoice: (index: number, value: string) => void;
    toggleDraftCorrect: (value: string, checked: boolean) => void;
    removeChoiceRow: (index: number) => void;
    addDraftChoiceRow: () => void;
  };
  stateFlags: {
    savingEdit: boolean;
    savingAdd: boolean;
    editorError: string | null;
    missingCorrectLive: boolean;
    ensureChoices: (choices?: string[] | null) => string[];
  };
}

const QuestionsSection: React.FC<QuestionsSectionProps> = ({
  questions,
  editingId,
  isAdding,
  draft,
  actions,
  stateFlags,
}) => {
  const renderChoiceList = (question: QuestionOut) => (
    <Stack $gap="sm">
      {(question.choices || []).map((choice, ci) => {
        const isCorrect = (question.correct_choices || []).includes(choice);
        return (
          <Flex
            key={ci}
            $gap="xs"
            $align="center"
            $p="sm"
            $radius="md"
            $bg={isCorrect ? "rgba(76, 175, 80, 0.12)" : "#f3f4f6"}
            $border={
              isCorrect
                ? "2px solid #4caf50"
                : "1px solid rgba(0,0,0,0.08)"
            }
          >
            <Text $variant="body3" $weight="medium">
              {String.fromCharCode(65 + ci)}.
            </Text>
            <MathText text={choice} />
          </Flex>
        );
      })}
    </Stack>
  );

  const renderOpenAnswerPlaceholder = () => (
    <Box $border="1px dashed #ccc" $radius="md" $bg="#fff" $p="sm" $height="80px">
      <Text $variant="body4" $tone="muted" style={{ fontStyle: "italic" }}>
        Odpowiedź otwarta…
      </Text>
    </Box>
  );

  return (
    <Stack $gap="lg">
      {questions.map((q, idx) => {
        const isEditing = editingId === q.id;
        if (isEditing) {
          return (
            <QuestionCard
              key={q.id}
              index={idx}
              title={
                <Text $variant="body2" $weight="medium">
                  Edytuj pytanie
                </Text>
              }
            >
              <QuestionEditor
                draft={draft}
                missingCorrectLive={stateFlags.missingCorrectLive}
                editorError={stateFlags.editorError}
                saving={stateFlags.savingEdit}
                onToggleClosed={actions.toggleDraftClosed}
                onSetDifficulty={actions.setDraftDifficulty}
                onTextChange={actions.onTextChange}
                onChangeChoice={actions.updateDraftChoice}
                onToggleCorrect={(value, next) => actions.toggleDraftCorrect(value, next)}
                onRemoveChoice={actions.removeChoiceRow}
                onAddChoice={actions.addDraftChoiceRow}
                onSave={actions.handleSaveEdit}
                onCancel={actions.cancelEdit}
                ensureChoices={stateFlags.ensureChoices}
              />
            </QuestionCard>
          );
        }
        return (
          <QuestionView
            key={q.id}
            question={q}
            index={idx}
            onEdit={() => actions.startEdit(q)}
            onDelete={() => actions.handleDelete(q.id)}
            choiceRenderer={() => (q.is_closed ? renderChoiceList(q) : renderOpenAnswerPlaceholder())}
          />
        );
      })}

      <Flex $justify="center">
        <Button $variant="info" $size="lg" onClick={actions.startAdd}>
          + Dodaj pytanie
        </Button>
      </Flex>

      {isAdding && (
        <QuestionCard
          key="new-question"
          index={questions.length}
          title={
            <Text $variant="body2" $weight="medium">
              Dodaj nowe pytanie
            </Text>
          }
        >
          <QuestionEditor
            draft={draft}
            missingCorrectLive={stateFlags.missingCorrectLive}
            editorError={stateFlags.editorError}
            saving={stateFlags.savingAdd}
            onToggleClosed={actions.toggleDraftClosed}
            onSetDifficulty={actions.setDraftDifficulty}
            onTextChange={actions.onTextChange}
            onChangeChoice={actions.updateDraftChoice}
            onToggleCorrect={(value, next) => actions.toggleDraftCorrect(value, next)}
            onRemoveChoice={actions.removeChoiceRow}
            onAddChoice={actions.addDraftChoiceRow}
            onSave={actions.handleAdd}
            onCancel={actions.cancelEdit}
            ensureChoices={stateFlags.ensureChoices}
          />
        </QuestionCard>
      )}
    </Stack>
  );
};

export default QuestionsSection;
