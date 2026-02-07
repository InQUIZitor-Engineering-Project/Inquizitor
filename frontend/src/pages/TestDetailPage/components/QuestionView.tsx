import React, { useState } from "react";
import styled from "styled-components";
import { MathText } from "../../../components/MathText/MathText";
import { Badge, Flex, Text, Checkbox } from "../../../design-system/primitives";
import { QuestionCard, IndexChip, Tooltip } from "../../../design-system/patterns";
import {
  SparklesIcon,
  PencilIcon,
  SettingsIcon,
  TrashIcon,
} from "./QuestionCardIcons";
import type { QuestionOut } from "../../../services/test";

const getDifficultyLabel = (d: number) => {
  if (d === 1) return "Łatwe";
  if (d === 2) return "Średnie";
  if (d === 3) return "Trudne";
  return `Poziom ${d}`;
};

export interface QuestionViewProps {
  question: QuestionOut;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onRegenerate?: () => void;
  onSettings?: () => void;
  choiceRenderer: () => React.ReactNode;
  isSelected?: boolean;
  onSelect?: (qid: number) => void;
  /** Optional drag handle for reordering (from useSortable). */
  dragHandle?: React.ReactNode;
}

const CardWrapper = styled.div`
  position: relative;
`;

const GutterSpacer = styled.div`
  width: 40px;
  height: 40px;
  flex-shrink: 0;
`;

const CheckboxWrap = styled.div<{ $visible: boolean }>`
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const MetaRow = styled(Flex)`
  ${({ theme }) => theme.media.down("sm")} {
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
  }
`;

const Toolbar = styled(Flex)`
  gap: 2px;
  align-items: center;
`;

const ToolbarButton = styled.button<{ $danger?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s;

  &:hover:not(:disabled) {
    background: ${({ $danger, theme }) =>
      $danger ? "#fef2f2" : (theme.colors?.tint?.t5 ?? "rgba(76, 175, 79, 0.12)")};
    color: ${({ $danger, theme }) =>
      $danger ? "#dc2626" : (theme.colors?.brand?.primary ?? "#4caf4f")};
  }

  &:disabled {
    cursor: default;
    opacity: 0.5;
  }

  &:focus-visible {
    outline: 2px solid #4f46e5;
    outline-offset: 2px;
  }
`;

const ToolbarDivider = styled.div`
  width: 1px;
  height: 18px;
  background: #e5e7eb;
  margin: 0 4px;
`;

const QuestionView: React.FC<QuestionViewProps> = ({
  question,
  index,
  onEdit,
  onDelete,
  onRegenerate,
  onSettings,
  choiceRenderer,
  isSelected,
  onSelect,
  dragHandle,
}) => {
  const [isCardHovered, setIsCardHovered] = useState(false);
  const showCheckbox = isCardHovered || (isSelected ?? false);

  const leftGutter = (
    <>
      {dragHandle ?? <GutterSpacer />}
      {onSelect && (
        <CheckboxWrap $visible={showCheckbox}>
          <Checkbox
            checked={isSelected}
            onChange={() => onSelect(question.id)}
            onClick={(e) => e.stopPropagation()}
          />
        </CheckboxWrap>
      )}
    </>
  );

  const toolbar = (
    <Toolbar $gap="none">
      <Tooltip content="Regeneruj z AI" disabled={!onRegenerate}>
        <ToolbarButton
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRegenerate?.();
          }}
          aria-label="Regeneruj z AI"
          disabled={!onRegenerate}
        >
          <SparklesIcon />
        </ToolbarButton>
      </Tooltip>
      <Tooltip content="Edytuj">
        <ToolbarButton
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          aria-label="Edytuj"
        >
          <PencilIcon />
        </ToolbarButton>
      </Tooltip>
      <Tooltip content="Zmień typ lub trudność" disabled={!onSettings}>
        <ToolbarButton
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSettings?.();
          }}
          aria-label="Zmień typ lub trudność"
          disabled={!onSettings}
        >
          <SettingsIcon />
        </ToolbarButton>
      </Tooltip>
      <ToolbarDivider />
      <Tooltip content="Usuń">
        <ToolbarButton
          type="button"
          $danger
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label="Usuń"
        >
          <TrashIcon />
        </ToolbarButton>
      </Tooltip>
    </Toolbar>
  );

  return (
    <CardWrapper
      onMouseEnter={() => setIsCardHovered(true)}
      onMouseLeave={() => setIsCardHovered(false)}
    >
      <QuestionCard
        className="ph-no-capture"
        style={
          isSelected
            ? { border: "2px solid #4CAF50", backgroundColor: "#f0fdf4" }
            : undefined
        }
        leftGutter={dragHandle != null || onSelect ? leftGutter : undefined}
        index={<IndexChip>{index + 1}</IndexChip>}
        title={
          <Text $variant="body2" $weight="medium" className="ph-no-capture">
            <MathText text={question.text} />
          </Text>
        }
        meta={
          <MetaRow $gap="xs" $wrap="nowrap" $justify="flex-end">
            <Badge
              $variant={
                question.difficulty === 1
                  ? "success"
                  : question.difficulty === 2
                    ? "warning"
                    : "danger"
              }
            >
              {getDifficultyLabel(question.difficulty)}
            </Badge>
            <Badge
              $variant={question.is_closed ? "info" : "brand"}
              style={
                question.is_closed
                  ? undefined
                  : { backgroundColor: "rgba(156, 39, 176, 0.12)", color: "#6a1b9a" }
              }
            >
              {question.is_closed ? "Zamknięte" : "Otwarte"}
            </Badge>
          </MetaRow>
        }
        actions={toolbar}
      >
        {choiceRenderer()}
      </QuestionCard>
    </CardWrapper>
  );
};

export default QuestionView;
