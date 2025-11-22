import styled from "styled-components";

export const CreateTestWrapper = styled.div`
  width: 100%;
  height: 100%;         /* kluczowe: wypełnia ContentArea */
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: ${({ theme }) => theme.colors.neutral.silver};
`;

export const ContentWrapper = styled.div`
  flex: 1;
  height: 100%;         /* dopinamy wysokość */
  overflow-y: auto;
  padding: 40px;
  /* ...reszta bez zmian... */
`;


export const InnerWrapper = styled.div`
  max-width: 900px; /* Zmniejszyłem z 1200px, żeby formularz był bardziej czytelny na środku */
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  padding-bottom: 60px; /* Miejsce na dole, żeby stopka nie uciekała */
  gap: 24px;
`;

export const Heading = styled.h1`
  ${({ theme }) => `
    font-family: ${theme.typography.heading.h2.fontFamily};
    font-size: ${theme.typography.heading.h2.fontSize};
    font-weight: ${theme.typography.heading.h2.fontWeight};
    line-height: ${theme.typography.heading.h2.lineHeight};
    color: ${theme.colors.neutral.dGrey};
  `}
  text-align: left;
  margin: 0 0 4px;
`;

export const Subheading = styled.p`
  ${({ theme }) => `
    font-family: ${theme.typography.body.regular.body2.fontFamily};
    font-size: ${theme.typography.body.regular.body2.fontSize};
    font-weight: ${theme.typography.body.regular.body2.fontWeight};
    line-height: ${theme.typography.body.regular.body2.lineHeight};
    color: ${theme.colors.neutral.grey};
  `}
  margin: 0;
`;

export const SectionCard = styled.div`
  background-color: ${({ theme }) => theme.colors.neutral.white};
  border-radius: 16px;
  padding: 24px 24px 20px;
  box-shadow: ${({ theme }) => theme.shadows["4px"]};
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const SectionHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;

  h3 {
    margin: 0;
    ${({ theme }) => `
      font-family: ${theme.typography.heading.h4.fontFamily};
      font-size: ${theme.typography.heading.h4.fontSize};
      font-weight: ${theme.typography.heading.h4.fontWeight};
      line-height: ${theme.typography.heading.h4.lineHeight};
      color: ${theme.colors.neutral.dGrey};
    `}
  }
`;

export const Hint = styled.p`
  ${({ theme }) => `
    font-family: ${theme.typography.body.regular.body3.fontFamily};
    font-size: ${theme.typography.body.regular.body3.fontSize};
    line-height: ${theme.typography.body.regular.body3.lineHeight};
    color: ${theme.colors.neutral.grey};
  `}
  margin: 4px 0 0;
`;

export const LabelRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;

  label {
    ${({ theme }) => `
      font-family: ${theme.typography.body.medium.body2.fontFamily};
      font-size: ${theme.typography.body.medium.body2.fontSize};
      font-weight: ${theme.typography.body.medium.body2.fontWeight};
      color: ${theme.colors.neutral.dGrey};
    `}
  }

  span {
    ${({ theme }) => `
      font-family: ${theme.typography.body.regular.body3.fontFamily};
      font-size: ${theme.typography.body.regular.body3.fontSize};
      color: ${theme.colors.neutral.grey};
    `}
  }
`;

export const ToggleGroup = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px;
  margin-top: 8px;
  margin-bottom: 12px;
  border-radius: 999px;
  background-color: ${({ theme }) => theme.colors.tint.t5};
  align-self: flex-start;
  width: fit-content;
  max-width: 100%;
  flex-wrap: wrap; /* Zabezpieczenie na małe ekrany */

  & > button {
    padding: 8px 18px;
    border: none;
    border-radius: 999px;
    background: transparent;
    cursor: pointer;
    transition: all 0.2s ease;
    ${({ theme }) => `
      font-family: ${theme.typography.body.medium.body3.fontFamily};
      font-size: ${theme.typography.body.medium.body3.fontSize};
    `}
    color: ${({ theme }) => theme.colors.neutral.dGrey};

    &.active {
      background-color: ${({ theme }) => theme.colors.brand.primary};
      color: ${({ theme }) => theme.colors.neutral.white};
      box-shadow: ${({ theme }) => theme.shadows["4px"]};
    }
  }
`;

export const TextArea = styled.textarea`
  width: 100%;
  min-height: 140px;
  padding: 12px 14px;
  border: 1px solid ${({ theme }) => theme.colors.neutral.greyBlue};
  border-radius: 10px;
  resize: vertical;
  max-height: 500px;
  font-family: ${({ theme }) =>
    theme.typography.body.regular.body2.fontFamily};
  font-size: ${({ theme }) => theme.typography.body.regular.body2.fontSize};
  box-sizing: border-box;
`;

export const UploadSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
`;

export const UploadButton = styled.button`
  ${({ theme }) => `
    font-family: ${theme.typography.body.medium.body2.fontFamily};
    font-size: ${theme.typography.body.medium.body2.fontSize};
    font-weight: ${theme.typography.body.medium.body2.fontWeight};
  `}
  padding: 10px 20px;
  border-radius: 999px;
  border: none;
  background: #2196f3;
  color: #ffffff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.25);
  transition: all 0.16s ease-in-out;

  &:disabled {
    background-color: ${({ theme }) => theme.colors.neutral.greyBlue};
    cursor: not-allowed;
    box-shadow: none;
  }
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(33, 150, 243, 0.3);
    background: #1e88e5;
  }
`;

export const UploadInfo = styled.p`
  ${({ theme }) => `
    font-family: ${theme.typography.body.regular.body3.fontFamily};
    font-size: ${theme.typography.body.regular.body3.fontSize};
  `}
  color: ${({ theme }) => theme.colors.neutral.grey};
  margin: 0;
`;

export const UploadError = styled.p`
  ${({ theme }) => `
    font-family: ${theme.typography.body.regular.body3.fontFamily};
    font-size: ${theme.typography.body.regular.body3.fontSize};
  `}
  color: ${({ theme }) => theme.colors.action.error};
  margin: 0;
`;

export const HiddenFileInput = styled.input`
  display: none;
`;

export const QuestionTypeGroup = styled.div`
  display: inline-flex;
  gap: 8px;
  flex-wrap: wrap;

  & > button {
    padding: 6px 14px;
    border: none;
    border-radius: 999px;
    background-color: ${({ theme }) => theme.colors.tint.t5};
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 13px;
    color: ${({ theme }) => theme.colors.neutral.dGrey};

    &.active {
      background-color: ${({ theme }) => theme.colors.brand.primary};
      color: ${({ theme }) => theme.colors.neutral.white};
      box-shadow: ${({ theme }) => theme.shadows["4px"]};
    }
  }
`;

export const DifficultyGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
`;

export const DifficultyField = styled.div`
  display: flex;
  flex-direction: column;

  label {
    margin-bottom: 4px;
    color: ${({ theme }) => theme.colors.neutral.grey};
    font-size: 13px;
  }

  input {
    padding: 8px 10px;
    border: 1px solid ${({ theme }) => theme.colors.neutral.greyBlue};
    border-radius: 8px;
    width: 100px;
    font-size: 14px;
  }
`;

export const GenerateButton = styled.button`
  ${({ theme }) => `
    font-family: ${theme.typography.body.medium.body2.fontFamily};
    font-size: ${theme.typography.body.medium.body2.fontSize};
    font-weight: ${theme.typography.body.medium.body2.fontWeight};
  `}
  align-self: flex-start;
  background-color: ${({ theme }) => theme.colors.brand.primary};
  color: #ffffff;
  padding: 14px 32px;
  border: none;
  background: #2196f3;
  border-radius: 999px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.25);
  margin-top: 4px;
  transition: all 0.16s ease-in-out;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(33, 150, 243, 0.3);
    background: #1e88e5;
  }
`;

export const ErrorText = styled.p`
  ${({ theme }) => `
    font-family: ${theme.typography.body.regular.body3.fontFamily};
    font-size: ${theme.typography.body.regular.body3.fontSize};
  `}
  color: ${({ theme }) => theme.colors.action.error};
  margin: 4px 0 0;
`;