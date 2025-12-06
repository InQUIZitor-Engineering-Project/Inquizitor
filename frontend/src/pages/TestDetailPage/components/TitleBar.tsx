import React from "react";
import editIcon from "../../../assets/icons/edit-icon.png";
import { Flex, Heading, Input, Button } from "../../../design-system/primitives";

export interface TitleBarProps {
  title: string;
  isEditing: boolean;
  titleDraft: string;
  onChangeDraft: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onBeginEdit: () => void;
}

const TitleBar: React.FC<TitleBarProps> = ({
  title,
  isEditing,
  titleDraft,
  onChangeDraft,
  onSave,
  onCancel,
  onBeginEdit,
}) => {
  return (
    <Flex $align="center" $gap="sm" $wrap="wrap">
      {isEditing ? (
        <>
          <Input
            $fullWidth
            value={titleDraft}
            onChange={(e) => onChangeDraft(e.target.value)}
            placeholder="Nazwa testu"
          />
          <Flex $gap="xs" $wrap="wrap">
            <Button $size="sm" onClick={onSave}>
              Zapisz
            </Button>
            <Button $size="sm" $variant="danger" onClick={onCancel}>
              Anuluj
            </Button>
          </Flex>
        </>
      ) : (
        <>
          <Heading as="h1" $level="h2">
            {title}
          </Heading>
          <Button $variant="ghost" $size="sm" onClick={onBeginEdit} title="Edytuj tytuł">
            <img src={editIcon} alt="Edytuj" width={16} height={16} />
            Edytuj
          </Button>
        </>
      )}
    </Flex>
  );
};

export default TitleBar;
