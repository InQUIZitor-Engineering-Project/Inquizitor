import styled from "styled-components";

export const QuestionHeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
`;

export const QuestionTitle = styled.div`
  flex: 1;
  font-weight: 500;
  font-size: 15px;
  line-height: 1.4;

  textarea {
    width: 100%;
    box-sizing: border-box;
    padding: 8px 10px;
    border-radius: 10px;
    border: 1px solid #ddd;
    font-size: 14px;
    font-family: inherit;
    resize: vertical;
  }
`;

export const QuestionMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;
`;

export const Badge = styled.span`
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

export const DifficultyBadge = styled(Badge)<{ $level: number }>`
  background: ${({ $level }) =>
    $level === 1
      ? "rgba(76, 175, 80, 0.12)"
      : $level === 2
      ? "rgba(255, 193, 7, 0.14)"
      : "rgba(244, 67, 54, 0.16)"};
  color: ${({ $level }) =>
    $level === 1
      ? "#2e7d32"
      : $level === 2
      ? "#f57f17"
      : "#c62828"};
`;

export const TypeBadge = styled(Badge)<{ $closed: boolean }>`
  background: ${({ $closed }) =>
    $closed ? "rgba(33, 150, 243, 0.12)" : "rgba(156, 39, 176, 0.12)"};
  color: ${({ $closed }) => ($closed ? "#1565c0" : "#6a1b9a")};
`;

export const MetaControls = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
`;

export const MetaSelect = styled.select`
  padding: 4px 8px;
  border-radius: 8px;
  border: 1px solid #ddd;
  font-size: 10px;
  background: #fff;
  cursor: pointer;
`;

export const MetaToggle = styled.button`
  padding: 3px 8px;
  border-radius: 999px;
  border: 1px solid #ddd;
  font-size: 10px;
  background: #f5f5f5;
  cursor: pointer;
  transition: all 0.15s ease-in-out;

  &.active-closed {
    background: rgba(33, 150, 243, 0.12);
    color: #1565c0;
    border-color: rgba(33, 150, 243, 0.4);
  }

  &.active-open {
    background: rgba(156, 39, 176, 0.12);
    color: #6a1b9a;
    border-color: rgba(156, 39, 176, 0.4);
  }
`;

export const QuestionActions = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 18px;
`;

export const BaseButton = styled.button`
  padding: 9px 14px;
  border-radius: 10px;
  border: none;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s ease-in-out;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
  }
`;

export const PrimaryButton = styled(BaseButton)`
  background: #4caf4f;
  color: #ffffff;
`;

export const DangerButton = styled(BaseButton)`
  background: rgba(244, 67, 54, 0.08);
  color: #c62828; 
  box-shadow: none;
  border: 1px solid rgba(244, 67, 54, 0.3);

  &:hover {
    background: rgba(244, 67, 54, 0.16);
    box-shadow: 0 3px 8px rgba(244, 67, 54, 0.18);
  }
`;


export const GhostButton = styled(BaseButton)`
  background: #f5f5f5;
  color: #333;
  box-shadow: none;

  &:hover {
    background: #e0e0e0;
    box-shadow: none;
  }
`;

export const EditButton = styled(BaseButton)`
  background: rgba(76, 175, 80, 0.08);
  color: #2e7d32;
  box-shadow: none;
  border: 1px solid rgba(76, 175, 80, 0.3);

  &:hover {
    background: rgba(76, 175, 80, 0.16);
    box-shadow: 0 3px 8px rgba(76, 175, 80, 0.18);
  }
`;

export const AddQuestionBar = styled.div`
  margin-top: 28px;
  margin-bottom: 10px;
`;

export const AddQuestionButton = styled.button`
  padding: 10px 20px;
  border-radius: 999px;
  border: none;
  background: #2196f3;
  color: #ffffff;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.25);
  transition: all 0.16s ease-in-out;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(33, 150, 243, 0.3);
    background: #1e88e5;
  }
`;

export const DownloadBar = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
`;

export const DownloadButton = styled(BaseButton)`
  background: #4caf4f;
  color: #ffffff;
`;

export const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background-color: ${({ theme }) => theme.colors.neutral.silver};
`;

export const ContentWrapper = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 32px clamp(24px, 4vw, 40px);

  /* szerzej + centrowanie kontentu */
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
`;

export const Header = styled.h1`
  ${({ theme }) => `
    font-family: ${theme.typography.heading.h2.fontFamily};
    font-size: ${theme.typography.heading.h2.fontSize};
    font-weight: ${theme.typography.heading.h2.fontWeight};
    line-height: ${theme.typography.heading.h2.lineHeight};
    color: ${theme.colors.neutral.dGrey};
  `}
  margin-bottom: 8px;
`;

export const MetaRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
`;

export const Meta = styled.div`
  ${({ theme }) => `
    font-family: ${theme.typography.body.regular.body3.fontFamily};
    font-size: ${theme.typography.body.regular.body3.fontSize};
    font-weight: ${theme.typography.body.regular.body3.fontWeight};
    line-height: ${theme.typography.body.regular.body3.lineHeight};
    color: ${theme.colors.neutral.grey};
  `}
`;

export const AiWarningBox = styled.div`
  ${({ theme }) => `
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    border-radius: 20px;
    color: ${theme.colors.brand.secondary};
    font-size: 12px;
    font-weight: 500;
    line-height: 1.2;
    white-space: nowrap;
  `}
`;

export const QuestionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

export const QuestionItem = styled.div`
  background-color: ${({ theme }) => theme.colors.neutral.white};
  padding: 24px;
  border-radius: 8px;
  box-shadow: ${({ theme }) => theme.shadows["4px"]};

  .question-header {
    ${({ theme }) => `
      font-family: ${theme.typography.body.medium.body1.fontFamily};
      font-size: ${theme.typography.body.medium.body1.fontSize};
      font-weight: ${theme.typography.body.medium.body1.fontWeight};
      line-height: ${theme.typography.body.medium.body1.lineHeight};
      color: ${theme.colors.neutral.dGrey};
    `}
    margin-bottom: 16px;
  }

  textarea {
    width: 100%;
    min-height: 80px;
    padding: 12px;
    border: 1px solid ${({ theme }) => theme.colors.neutral.greyBlue};
    border-radius: 8px;
    resize: vertical;
    font-family: ${({ theme }) => theme.typography.body.regular.body1.fontFamily};
  }
`;

export const ChoiceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const ChoiceItem = styled.div<{ $correct?: boolean }>`
  position: relative;
  padding: 12px 16px;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.colors.neutral.silver};
  cursor: default;

  ${({ $correct, theme }) =>
    $correct
      ? `
    border: 2px solid ${theme.colors.brand.primary};
    background-color: ${theme.colors.tint.t4};
  `
      : `
    border: 1px solid ${theme.colors.neutral.greyBlue};
  `}

  ${({ theme }) => `
    font-family: ${theme.typography.body.regular.body1.fontFamily};
    font-size: ${theme.typography.body.regular.body1.fontSize};
    line-height: ${theme.typography.body.regular.body1.lineHeight};
    color: ${theme.colors.neutral.dGrey};
  `}
`;

export const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
`;

export const TitleEditIconBtn = styled.button`
  border: none;
  background: transparent;
  padding: 4px;
  border-radius: 8px;
  cursor: pointer;
  line-height: 0;

  &:hover {
    background: rgba(0,0,0,0.06);
  }

  img {
    width: 18px;
    height: 18px;
    display: block;
  }
`;

export const HeaderInput = styled.input`
  flex: 1;
  ${({ theme }) => `
    font-family: ${theme.typography.heading.h2.fontFamily};
    font-size: ${theme.typography.heading.h2.fontSize};
    font-weight: ${theme.typography.heading.h2.fontWeight};
    line-height: ${theme.typography.heading.h2.lineHeight};
    color: ${theme.colors.neutral.dGrey};
  `}
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 10px;
  background: #fff;
`;

export const TitleActions = styled.div`
  display: inline-flex;
  gap: 8px;
`;

export const TitleSmallButton = styled.button`
  padding: 6px 10px;
  border-radius: 8px;
  border: none;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0,0,0,0.06);
  transition: all .15s ease-in-out;
  background: #4caf4f;
  color: #fff;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(0,0,0,0.08);
  }
`;

export const TitleSmallCancel = styled(TitleSmallButton)`
  background: rgba(244, 67, 54, 0.08);
  color: #c62828;
  box-shadow: none;
  border: 1px solid rgba(244, 67, 54, 0.3);

  &:hover {
    background: rgba(244, 67, 54, 0.16);
    box-shadow: 0 3px 8px rgba(244, 67, 54, 0.18);
  }
`;


export const EditorCard = styled.div`
  background: linear-gradient(0deg, #fff, #fff), rgba(33, 150, 243, 0.03);
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.04);
`;

export const EditorToolbar = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
`;

export const EditorTextarea = styled.textarea`
  width: 100%;
  min-height: 140px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid #dfe4ea;
  background: #fff;
  font-size: 15px;
  line-height: 1.5;
  transition: box-shadow .15s ease, border-color .15s ease;
  resize: vertical;

  &::placeholder { color: #9aa4b2; }
  &:focus {
    outline: none;
    border-color: #64b5f6;
    box-shadow: 0 0 0 4px rgba(33,150,243,.12);
  }
`;

export const Segmented = styled.div`
  display: inline-flex;
  padding: 4px;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.tint.t5};
  gap: 4px;

  button {
    font-size: 12px;
    padding: 6px 10px;
    border-radius: 999px;
    border: 0;
    background: transparent;
    color: ${({ theme }) => theme.colors.neutral.dGrey};
    cursor: pointer;
  }
  .is-active-closed {
    background: rgba(33,150,243,.12);
    color: #1565c0;
  }
  .is-active-open {
    background: rgba(156,39,176,.12);
    color: #6a1b9a;
  }
`;

export const NiceSelect = styled(MetaSelect)`
  font-size: 12px;
  padding: 6px 10px;
`;

export const ChoiceListEditor = styled.ul`
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const ChoiceRow = styled.li`
  display: grid;
  grid-template-columns: 36px 1fr auto auto;
  align-items: center;
  gap: 10px;
  background: ${({ theme }) => theme.colors.neutral.silver};
  border: 1px solid ${({ theme }) => theme.colors.neutral.greyBlue};
  border-radius: 10px;
  padding: 8px 10px;
`;

export const TrashBtn = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid rgba(244, 67, 54, 0.35);
  background: rgba(244, 67, 54, 0.06);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all .15s ease;

  &:hover {
    background: rgba(244, 67, 54, 0.12);
    transform: translateY(-1px);
  }

  img {
    width: 16px;
    height: 16px;
    display: block;
  }
`;
export const LetterBubble = styled.span`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 12px;
  color: #1565c0;
  background: rgba(33,150,243,.12);
`;

export const ChoiceInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #dfe4ea;
  background: #fff;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #80cbc4;
    box-shadow: 0 0 0 3px rgba(0,150,136,.12);
  }
`;

export const CorrectToggle = styled.button<{ $active?: boolean }>`
  border: 1px solid ${({ $active }) => ($active ? "rgba(76,175,80,.4)" : "#dfe4ea")};
  background: ${({ $active }) => ($active ? "rgba(76,175,80,.12)" : "#fff")};
  color: ${({ $active }) => ($active ? "#2e7d32" : "#4b5563")};
  font-size: 12px;
  padding: 8px 10px;
  border-radius: 999px;
  cursor: pointer;
  transition: all .15s ease;
`;

export const AddChoiceBtn = styled(GhostButton)`
  background: rgba(33,150,243,.08);
  color: #1565c0;
  border: 1px dashed rgba(33,150,243,.35);
  margin-top: 6px;

  &:hover { background: rgba(33,150,243,.14); }
`;

export const EditorActions = styled(QuestionActions)`
  justify-content: flex-end;
  margin-top: 16px;
`;

export const EditorLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  letter-spacing: .02em;
  color: #6b7280;
  margin-bottom: 6px;
`;

export const Counter = styled.span`
  font-size: 11px;
  color: #9aa3af;
  margin-left: 8px;
`;

export const Divider = styled.div`
  height: 1px;
  background: rgba(0,0,0,.06);
  margin: 12px 0 8px;
`;

export const IndexChip = styled.span`
  min-width: 26px;
  height: 26px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 12px;
  color: #374151;
  background: #eef2ff;
  border: 1px solid #dbeafe;
`;

export const ChoiceCheckbox = styled.input.attrs({ type: "checkbox" })`
  width: 16px;
  height: 16px;
  accent-color: #4caf50;
`;

export const EditorHint = styled.div`
  font-size: 12px;
  color: #6b7280;
  font-style: italic;
  margin-top: 8px;
`;

export const ErrorNote = styled.div`
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(244, 67, 54, 0.08);
  border: 1px solid rgba(244, 67, 54, 0.3);
  color: #c62828;
  font-size: 12px;
`;
