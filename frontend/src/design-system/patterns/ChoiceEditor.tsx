import React from "react";
import styled from "styled-components";
import { Stack, Input, Button } from "../primitives";

export interface ChoiceItem {
  value: string;
  isCorrect: boolean;
}

export interface ChoiceEditorProps {
  items: ChoiceItem[];
  onChange: (index: number, value: string) => void;
  onToggleCorrect: (index: number, next: boolean) => void;
  onRemove?: (index: number) => void;
  onAdd?: () => void;
  addLabel?: string;
}

const Row = styled.div`
  display: grid;
  grid-template-columns: 36px 1fr auto auto;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.neutral.silver};
  border: 1px solid ${({ theme }) => theme.colors.neutral.greyBlue};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacing.sm};

  ${({ theme }) => theme.media.down("sm")} {
    grid-template-columns: 36px 1fr;
    grid-template-rows: auto auto;
    align-items: start;
  }
`;

const ActionsRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  flex-wrap: wrap;
  justify-content: flex-start;

  ${({ theme }) => theme.media.down("sm")} {
    grid-column: 2 / 3;
  }
`;

const LetterBubble = styled.span`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 12px;
  color: #1565c0;
  background: rgba(33, 150, 243, 0.12);
`;

const ChoiceEditor: React.FC<ChoiceEditorProps> = ({
  items,
  onChange,
  onToggleCorrect,
  onRemove,
  onAdd,
  addLabel = "+ Dodaj odpowiedź",
}) => {
  return (
    <Stack $gap="sm">
      {items.map((item, index) => (
        <Row key={index}>
          <LetterBubble>{String.fromCharCode(65 + index)}</LetterBubble>
          <Input
            $fullWidth
            value={item.value}
            onChange={(e) => onChange(index, e.target.value)}
            placeholder={`Odpowiedź ${String.fromCharCode(65 + index)}`}
          />
          <ActionsRow>
            <Button
              $variant={item.isCorrect ? "success" : "outline"}
              $size="sm"
              onClick={() => onToggleCorrect(index, !item.isCorrect)}
              title={item.isCorrect ? "Usuń oznaczenie poprawnej" : "Oznacz jako poprawną"}
            >
              {item.isCorrect ? "Poprawna" : "Ustaw jako poprawną"}
            </Button>
            {onRemove && (
              <Button $variant="danger" $size="sm" onClick={() => onRemove(index)} title="Usuń odpowiedź">
                Usuń
              </Button>
            )}
          </ActionsRow>
        </Row>
      ))}
      {onAdd && (
        <Button $variant="ghost" $size="sm" onClick={onAdd}>
          {addLabel}
        </Button>
      )}
    </Stack>
  );
};

export default ChoiceEditor;
