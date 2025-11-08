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
  background: #f44336;
  color: #ffffff;
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
  display: grid;
  grid-template-columns: 280px 1fr;
  height: calc(100vh - 80px);
  background-color: ${({ theme }) => theme.colors.neutral.silver};
`;

export const ContentWrapper = styled.div`
  padding: 40px;
  overflow-y: auto;
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

export const Meta = styled.p`
  ${({ theme }) => `
    font-family: ${theme.typography.body.regular.body3.fontFamily};
    font-size: ${theme.typography.body.regular.body3.fontSize};
    font-weight: ${theme.typography.body.regular.body3.fontWeight};
    line-height: ${theme.typography.body.regular.body3.lineHeight};
    color: ${theme.colors.neutral.grey};
  `}
  margin-bottom: 24px;
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
