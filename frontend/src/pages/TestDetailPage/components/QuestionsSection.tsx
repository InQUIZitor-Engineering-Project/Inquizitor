import React from "react";
import styled from "styled-components";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Box, Button, Flex, Stack, Text } from "../../../design-system/primitives";
import { QuestionCard } from "../../../design-system/patterns";
import QuestionView from "./QuestionView";
import QuestionEditor from "./QuestionEditor";
import MetaSummary from "./MetaSummary";
import type { QuestionOut } from "../../../services/test";
import { MathText } from "../../../components/MathText/MathText";
import { MAX_QUESTIONS_TOTAL } from "../../CreateTestAIPage/constants";

const DragHandle = styled.div<{ $disabled?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  color: #6b7280;
  cursor: ${({ $disabled }) => ($disabled ? "default" : "grab")};
  touch-action: none;
  &:hover {
    background: ${({ $disabled }) => ($disabled ? "transparent" : "#f3f4f6")};
    color: ${({ $disabled }) => ($disabled ? "#6b7280" : "#374151")};
  }
  &:active {
    cursor: ${({ $disabled }) => ($disabled ? "default" : "grabbing")};
  }
`;

export interface QuestionsSectionProps {
  questions: QuestionOut[];
  editingId: number | null;
  isAdding: boolean;
  draft: Partial<QuestionOut>;
  selectedIds: number[];
  summary: {
    total: number;
    easy: number;
    medium: number;
    hard: number;
  };
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
    toggleSelect: (qid: number) => void;
    selectAll: () => void;
    clearSelection: () => void;
    onReorderQuestions?: (questionIds: number[]) => Promise<void>;
    /** Select this question and open regenerate modal. */
    onRegenerateForQuestion?: (qId: number) => void;
    /** Select this question and open type (open/closed) modal. */
    onSettingsForQuestion?: (qId: number) => void;
  };
  stateFlags: {
    savingEdit: boolean;
    savingAdd: boolean;
    editorError: string | null;
    missingCorrectLive: boolean;
    ensureChoices: (choices?: string[] | null) => string[];
  };
}

function SortableQuestionRow({
  id,
  disabled,
  children,
  renderView,
}: {
  id: number;
  disabled: boolean;
  children?: React.ReactNode;
  renderView: (handle: React.ReactNode) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handle = disabled ? null : (
    <DragHandle
      $disabled={disabled}
      {...listeners}
      {...attributes}
      title="Zmień kolejność"
      aria-label="Zmień kolejność"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <circle cx="8" cy="6" r="2" />
        <circle cx="16" cy="6" r="2" />
        <circle cx="8" cy="12" r="2" />
        <circle cx="16" cy="12" r="2" />
        <circle cx="8" cy="18" r="2" />
        <circle cx="16" cy="18" r="2" />
      </svg>
    </DragHandle>
  );

  return (
    <div ref={setNodeRef} style={style}>
      {children ?? renderView(handle)}
    </div>
  );
}

const QuestionsSection: React.FC<QuestionsSectionProps> = ({
  questions,
  editingId,
  isAdding,
  draft,
  selectedIds,
  summary,
  actions,
  stateFlags,
}) => {
  const canAdd = questions.length < MAX_QUESTIONS_TOTAL;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !actions.onReorderQuestions) return;
    const oldIndex = questions.findIndex((q) => q.id === active.id);
    const newIndex = questions.findIndex((q) => q.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = [...questions];
    const [removed] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, removed);
    actions.onReorderQuestions(reordered.map((q) => q.id));
  };

  const renderChoiceList = (question: QuestionOut) => (
    <Stack $gap="sm" className="ph-no-capture">
      {(question.choices || []).map((choice, ci) => {
        const isCorrect = (question.correct_choices || []).includes(choice);
        return (
          <Flex
            key={ci}
            $gap="xs"
            $align="center"
            $p="sm"
            $radius="md"
            $bg={isCorrect ? "rgba(76, 175, 80, 0.25)" : "transparent"}
            $border={
              isCorrect
                ? "2px solid #4caf50"
                : `1px solid ${((props: any) => props.theme.colors.neutral.greyBlue)}`
            }
          >
            <Text $variant="body3" $weight="medium" $tone={isCorrect ? "default" : "default"}>
              {String.fromCharCode(65 + ci)}.
            </Text>
            <Box style={{ color: isCorrect ? "#4caf50" : "inherit", fontWeight: isCorrect ? 700 : 400 }}>
              <MathText text={choice} />
            </Box>
          </Flex>
        );
      })}
    </Stack>
  );

  const renderOpenAnswerPlaceholder = () => (
    <Box $border={`1px dashed ${((props: any) => props.theme.colors.neutral.greyBlue)}`} $radius="md" $bg="transparent" $p="sm" $height="80px" className="ph-no-capture">
      <Text $variant="body4" $tone="muted" style={{ fontStyle: "italic" }}>
        Odpowiedź otwarta…
      </Text>
    </Box>
  );

  return (
    <Stack $gap="xl">
      <Flex $justify="space-between" $align="center" $wrap="wrap" $gap="md">
        <MetaSummary {...summary} />
        <Flex $gap="sm">
          <Button $variant="outline" $size="sm" onClick={actions.selectAll}>
            Zaznacz wszystko
          </Button>
          {selectedIds.length > 0 && (
            <Button $variant="danger" $size="sm" onClick={actions.clearSelection}>
              Odznacz wszystko ({selectedIds.length})
            </Button>
          )}
        </Flex>
      </Flex>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <SortableContext
          items={questions.map((q) => q.id)}
          strategy={verticalListSortingStrategy}
        >
          {questions.map((q, idx) => {
            const isEditing = editingId === q.id;
            return (
              <SortableQuestionRow
                key={q.id}
                id={q.id}
                disabled={isAdding || isEditing}
                renderView={(dragHandle) =>
                  isEditing ? (
                    <QuestionCard
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
                        onToggleCorrect={(value, next) =>
                          actions.toggleDraftCorrect(value, next)
                        }
                        onRemoveChoice={actions.removeChoiceRow}
                        onAddChoice={actions.addDraftChoiceRow}
                        onSave={actions.handleSaveEdit}
                        onCancel={actions.cancelEdit}
                        ensureChoices={stateFlags.ensureChoices}
                      />
                    </QuestionCard>
                  ) : (
                    <QuestionView
                      question={q}
                      index={idx}
                      onEdit={() => actions.startEdit(q)}
                      onDelete={() => actions.handleDelete(q.id)}
                      onRegenerate={
                        actions.onRegenerateForQuestion
                          ? () => actions.onRegenerateForQuestion!(q.id)
                          : undefined
                      }
                      onSettings={
                        actions.onSettingsForQuestion
                          ? () => actions.onSettingsForQuestion!(q.id)
                          : undefined
                      }
                      choiceRenderer={() =>
                        q.is_closed
                          ? renderChoiceList(q)
                          : renderOpenAnswerPlaceholder()
                      }
                      isSelected={selectedIds.includes(q.id)}
                      onSelect={actions.toggleSelect}
                      dragHandle={dragHandle}
                    />
                  )
                }
              />
            );
          })}
        </SortableContext>
      </DndContext>

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

      {!isAdding && canAdd && (
        <Flex $justify="center" $mt="md">
          <Button $variant="info" $size="lg" onClick={actions.startAdd}>
            + Dodaj pytanie
          </Button>
        </Flex>
      )}
    </Stack>
  );
};

export default QuestionsSection;
