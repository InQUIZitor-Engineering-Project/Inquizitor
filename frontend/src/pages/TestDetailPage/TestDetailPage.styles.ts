import styled, { css } from "styled-components";

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
    border-radius: ${({ theme }) => theme.radii.md};
    border: 1px solid ${({ theme }) => theme.colors.neutral.greyBlue};
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

export const QuestionActions = styled.div`
  ${({ theme }) => css`
    display: flex;
    gap: ${theme.spacing.sm};
    margin-top: ${theme.spacing.md};
    flex-wrap: wrap;
  `}
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
  ${({ theme }) => css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: ${theme.spacing.md};
    margin-bottom: ${theme.spacing.lg};
  `}
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

export const QuestionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

export const QuestionItem = styled.div`
  ${({ theme }) => css`
    background-color: ${theme.colors.neutral.white};
    padding: ${theme.spacing.lg};
    border-radius: ${theme.radii.lg};
    box-shadow: ${theme.elevation.md};

    .question-header {
      font-family: ${theme.typography.body.medium.body1.fontFamily};
      font-size: ${theme.typography.body.medium.body1.fontSize};
      font-weight: ${theme.typography.body.medium.body1.fontWeight};
      line-height: ${theme.typography.body.medium.body1.lineHeight};
      color: ${theme.colors.neutral.dGrey};
      margin-bottom: ${theme.spacing.md};
    }

    textarea {
      width: 100%;
      min-height: 80px;
      padding: ${theme.spacing.md};
      border: 1px solid ${theme.colors.neutral.greyBlue};
      border-radius: ${theme.radii.md};
      resize: vertical;
      font-family: ${theme.typography.body.regular.body1.fontFamily};
    }
  `}
`;

export const ChoiceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const ChoiceItem = styled.div<{ $correct?: boolean }>`
  ${({ theme, $correct }) => css`
    position: relative;
    padding: ${theme.spacing.md};
    border-radius: ${theme.radii.md};
    background-color: ${theme.colors.neutral.silver};
    cursor: default;
    border: ${$correct
      ? `2px solid ${theme.colors.brand.primary}`
      : `1px solid ${theme.colors.neutral.greyBlue}`};
    background-color: ${$correct ? theme.colors.tint.t4 : theme.colors.neutral.silver};
    font-family: ${theme.typography.body.regular.body2.fontFamily};
    font-size: ${theme.typography.body.regular.body2.fontSize};
    line-height: ${theme.typography.body.regular.body2.lineHeight};
    color: ${theme.colors.neutral.dGrey};
  `}
`;

export const TitleRow = styled.div`
  ${({ theme }) => css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing.sm};
    margin-bottom: ${theme.spacing.xs};
  `}
`;

export const TitleEditIconBtn = styled.button`
  ${({ theme }) => css`
    border: none;
    background: transparent;
    padding: ${theme.spacing.xxs};
    border-radius: ${theme.radii.sm};
    cursor: pointer;
    line-height: 0;

    &:hover {
      background: ${theme.colors.neutral.silver};
    }

    img {
      width: 18px;
      height: 18px;
      display: block;
    }
  `}
`;

export const HeaderInput = styled.input`
  ${({ theme }) => css`
    flex: 1;
    font-family: ${theme.typography.heading.h2.fontFamily};
    font-size: ${theme.typography.heading.h2.fontSize};
    font-weight: ${theme.typography.heading.h2.fontWeight};
    line-height: ${theme.typography.heading.h2.lineHeight};
    color: ${theme.colors.neutral.dGrey};
    padding: ${theme.spacing.xs} ${theme.spacing.sm};
    border: 1px solid ${theme.colors.neutral.greyBlue};
    border-radius: ${theme.radii.lg};
    background: ${theme.colors.neutral.white};
  `}
`;

export const TitleActions = styled.div`
  display: inline-flex;
  gap: 8px;
`;


export const EditorCard = styled.div`
  ${({ theme }) => css`
    background: ${theme.colors.neutral.white};
    border: 1px solid ${theme.colors.neutral.greyBlue};
    border-radius: ${theme.radii.lg};
    padding: ${theme.spacing.md};
    box-shadow: ${theme.elevation.md};
  `}
`;

export const EditorToolbar = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

export const EditorTextarea = styled.textarea`
  ${({ theme }) => css`
    width: 100%;
    min-height: 140px;
    padding: ${theme.spacing.md};
    border-radius: ${theme.radii.lg};
    border: 1px solid ${theme.colors.neutral.greyBlue};
    background: ${theme.colors.neutral.white};
    font-size: 15px;
    line-height: 1.5;
    transition: box-shadow 0.15s ease, border-color 0.15s ease;
    resize: vertical;

    &::placeholder {
      color: ${theme.colors.neutral.lGrey};
    }
    &:focus {
      outline: none;
      border-color: ${theme.colors.brand.info};
      box-shadow: 0 0 0 4px ${theme.colors.tint.t5};
    }
  `}
`;

export const Segmented = styled.div`
  display: inline-flex;
  padding: 4px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.tint.t5};
  gap: 4px;

  button {
    font-size: 12px;
    padding: 6px 10px;
    border-radius: ${({ theme }) => theme.radii.pill};
    border: 0;
    background: transparent;
    color: ${({ theme }) => theme.colors.neutral.dGrey};
    cursor: pointer;
  }
  .is-active-closed {
    background: ${({ theme }) => theme.colors.tint.t5};
    color: ${({ theme }) => theme.colors.brand.info};
  }
  .is-active-open {
    background: ${({ theme }) => theme.colors.tint.t4};
    color: ${({ theme }) => theme.colors.brand.secondary};
  }
`;

export const EditorActions = styled(QuestionActions)`
  justify-content: flex-end;
  margin-top: 16px;
`;

export const Divider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colors.neutral.greyBlue};
  opacity: 0.4;
  margin: 12px 0 8px;
`;

export const EditorHint = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.neutral.grey};
  font-style: italic;
  margin-top: 8px;
`;

export const ErrorNote = styled.div`
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: ${({ theme }) => theme.colors.danger.bg};
  border: 1px solid ${({ theme }) => theme.colors.danger.border};
  color: ${({ theme }) => theme.colors.danger.main};
  font-size: 12px;
`;

export const ConfigActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
`;

export const ConfigSection = styled.div`
  margin-top: 16px;
  margin-bottom: 8px;
`;