import styled from "styled-components";

export const DashboardWrapper = styled.div`
  display: grid;
  grid-template-columns: 280px 1fr;
  min-height: calc(100vh - 80px);
  background-color: ${({ theme }) => theme.colors.neutral.silver};
`;

export const Sidebar = styled.aside`
  display: flex;
  flex-direction: column;
  padding: 24px;
  background-color: ${({ theme }) => theme.colors.neutral.white};
  box-shadow: ${({ theme }) => theme.shadows["2px"]};
`;

export const SearchInput = styled.input`
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.colors.neutral.greyBlue};
  border-radius: 8px;
  margin-bottom: 24px;
  outline: none;
`;

export const TestList = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const TestItem = styled.div`
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  &:hover {
    background-color: ${({ theme }) => theme.colors.tint.t5};
  }
`;

export const CreateNewButton = styled.button`
  ${({ theme }) => `
    font-family: ${theme.typography.body.medium.body2.fontFamily};
    font-size: ${theme.typography.body.medium.body2.fontSize};
    font-weight: ${theme.typography.body.medium.body2.fontWeight};
  `}
  background-color: ${({ theme }) => theme.colors.brand.primary};
  color: ${({ theme }) => theme.colors.neutral.white};
  padding: 12px;
  border: none;
  border-radius: 8px;
  margin-top: 16px;
  cursor: pointer;
  box-shadow: ${({ theme }) => theme.shadows["2px"]};
`;

export const ContentArea = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;       /* poziome wyśrodkowanie */
  padding: 40px;
  overflow-y: auto;
  gap: 32px;                  /* odstęp między sekcjami */
`;

export const Heading = styled.h1`
  ${({ theme }) => `
    text-align: center;
    font-family: ${theme.typography.heading.h2.fontFamily};
    font-size: ${theme.typography.heading.h2.fontSize};
    font-weight: ${theme.typography.heading.h2.fontWeight};
    line-height: ${theme.typography.heading.h2.lineHeight};
    color: ${theme.colors.neutral.dGrey};
  `}
  margin-bottom: 24px;
`;
export const Subheading = styled.p`
  ${({ theme }) => `
    text-align: center;
    font-family: ${theme.typography.body.regular.body2.fontFamily};
    font-size: ${theme.typography.body.regular.body2.fontSize};
    font-weight: ${theme.typography.body.regular.body2.fontWeight};
    line-height: ${theme.typography.body.regular.body2.lineHeight};
    color: ${theme.colors.neutral.grey};
  `}
  margin: 16px 0 8px;
`;

export const ToggleGroup = styled.div`
  display: flex;
  gap: 8px;
  border-radius: 8px;
  overflow: hidden;

  & > button {
    padding: 8px 16px;
    border: none;
    background-color: ${({ theme }) => theme.colors.tint.t5};
    cursor: pointer;
    transition: box-shadow 0.2s, background-color 0.2s;

    &:first-child {
      border-right: 1px solid ${({ theme }) => theme.colors.neutral.white};
    }

    &.active {
      background-color: ${({ theme }) => theme.colors.neutral.white};
      box-shadow: ${({ theme }) => theme.shadows["8px"]};
    }
  }
`;

export const TextArea = styled.textarea`
  width: 100%;
  height: 120px;
  padding: 12px;
  border: 1px solid ${({ theme }) => theme.colors.neutral.greyBlue};
  border-radius: 8px;
  resize: vertical;
`;

export const QuestionTypeGroup = styled.div`
  display: inline-flex;
  gap: 8px;
  margin: 8px 0;

  & > button {
    padding: 6px 12px;
    border: none;
    border-radius: 8px;
    background-color: ${({ theme }) => theme.colors.tint.t5};
    cursor: pointer;
    transition: box-shadow 0.2s, background-color 0.2s;

    &.active {
      background-color: ${({ theme }) => theme.colors.neutral.white};
      box-shadow: ${({ theme }) => theme.shadows["8px"]};
    }
  }
`;

export const DifficultyGroup = styled.div`
  display: flex;
  gap: 16px;
  margin: 8px 0 24px;
`;
export const DifficultyField = styled.div`
  display: flex;
  flex-direction: column;
  label {
    margin-bottom: 4px;
    color: ${({ theme }) => theme.colors.neutral.grey};
  }
  input {
    padding: 8px;
    border: 1px solid ${({ theme }) => theme.colors.neutral.greyBlue};
    border-radius: 8px;
    width: 100px;
  }
`;

export const GenerateButton = styled.button`
  ${({ theme }) => `
    font-family: ${theme.typography.body.medium.body2.fontFamily};
    font-size: ${theme.typography.body.medium.body2.fontSize};
    font-weight: ${theme.typography.body.medium.body2.fontWeight};
  `}
  background-color: ${({ theme }) => theme.colors.brand.primary};
  color: ${({ theme }) => theme.colors.neutral.white};
  padding: 14px 28px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: ${({ theme }) => theme.shadows["2px"]};
  margin-top: 24px;
`;

export const EmptyStateWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: calc(100vh - 80px);
  text-align: center;
  gap: 24px;
  background-color: ${({ theme }) => theme.colors.neutral.silver};
`;
export const EmptyStateImage = styled.img`
  width: 200px;
`;
export const EmptyStateHeading = styled.h2`
  ${({ theme }) => `
    font-family: ${theme.typography.heading.h3.fontFamily};
    font-size: ${theme.typography.heading.h3.fontSize};
    font-weight: ${theme.typography.heading.h3.fontWeight};
  `}
`;
export const EmptyStateButton = styled.button`
  ${({ theme }) => `
    font-family: ${theme.typography.body.medium.body2.fontFamily};
    font-size: ${theme.typography.body.medium.body2.fontSize};
    font-weight: ${theme.typography.body.medium.body2.fontWeight};
  `}
  background-color: ${({ theme }) => theme.colors.brand.primary};
  color: ${({ theme }) => theme.colors.neutral.white};
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
`;
