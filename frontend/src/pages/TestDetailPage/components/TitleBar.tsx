import React from "react";
import styled from "styled-components";
import editIcon from "../../../assets/icons/edit-icon.png";
import { Flex, Heading, Input, Button, Box } from "../../../design-system/primitives";

export interface TitleBarProps {
  title: string;
  isEditing: boolean;
  titleDraft: string;
  onChangeDraft: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onBeginEdit: () => void;
  onEditConfig?: () => void;
}

const ActionButton = styled(Button)`
  ${({ theme }) => theme.media.down("sm")} {
    padding: 6px 10px;
    font-size: 12px;
    
    img {
      width: 14px;
      height: 14px;
    }
  }
`;

const TitleBar: React.FC<TitleBarProps> = ({
  title,
  isEditing,
  titleDraft,
  onChangeDraft,
  onSave,
  onCancel,
  onBeginEdit,
  onEditConfig,
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
            <ActionButton onClick={onSave}>
              Zapisz
            </ActionButton>
            <ActionButton $variant="danger" onClick={onCancel}>
              Anuluj
            </ActionButton>
          </Flex>
        </>
      ) : (
        <>
          <Heading as="h1" $level="h2">
            {title}
          </Heading>
          <Flex $gap="xs" $wrap="wrap">
            <ActionButton $variant="ghost" onClick={onBeginEdit} title="Edytuj tytuł">
              <img src={editIcon} alt="Edytuj" width={16} height={16} />
              Edytuj tytuł
            </ActionButton>
            {onEditConfig && (
              <ActionButton $variant="ghost" onClick={onEditConfig} title="Dostosuj konfigurację">
                <Box as="span" style={{ fontSize: "16px", lineHeight: 1 }}>⚙️</Box>
                Wróć do konfiguracji
              </ActionButton>
            )}
          </Flex>
        </>
      )}
    </Flex>
  );
};

export default TitleBar;
