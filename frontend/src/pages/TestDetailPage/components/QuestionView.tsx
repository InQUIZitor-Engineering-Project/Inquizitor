import React from "react";
import { MathText } from "../../../components/MathText/MathText";
import { Badge, Button, Flex, Text } from "../../../design-system/primitives";
import { QuestionCard } from "../../../design-system/patterns";
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
  choiceRenderer: () => React.ReactNode;
}

const QuestionView: React.FC<QuestionViewProps> = ({ question, index, onEdit, onDelete, choiceRenderer }) => {
  return (
    <QuestionCard
      index={index}
      title={
        <Text $variant="body2" $weight="medium">
          <MathText text={question.text} />
        </Text>
      }
      meta={
        <Flex $gap="xs" $wrap="nowrap" $justify="flex-end">
          <Badge
            $variant={question.difficulty === 1 ? "success" : question.difficulty === 2 ? "warning" : "danger"}
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
        </Flex>
      }
      actions={
        <Flex $gap="sm" $wrap="wrap">
          <Button $variant="success" onClick={onEdit}>
            Edytuj
          </Button>
          <Button $variant="danger" onClick={onDelete}>
            Usuń
          </Button>
        </Flex>
      }
    >
      {choiceRenderer()}
    </QuestionCard>
  );
};

export default QuestionView;
