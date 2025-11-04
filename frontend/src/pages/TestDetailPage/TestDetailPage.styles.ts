import styled from "styled-components";

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
