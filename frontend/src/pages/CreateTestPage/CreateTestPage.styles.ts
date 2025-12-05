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
  align-self: center;
  background-color: ${({ theme }) => theme.colors.brand.primary};
  color: #ffffff;
  padding: 16px 44px;
  border: none;
  background: #2196f3;
  border-radius: 999px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.25);
  margin-top: 8px;
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
  margin: 8px 0 0;
  text-align: center;
  align-self: center;
  max-width: 720px;
  line-height: 1.4;
`;


export const SectionRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const StatPill = styled.span`
  padding: 6px 12px;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.tint.t5};
  color: ${({ theme }) => theme.colors.neutral.dGrey};
  font-weight: 600;
  font-size: 12px;
`;

export const FieldsGrid = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(4, minmax(140px, 1fr));

  @media (max-width: 980px) {
    grid-template-columns: repeat(2, minmax(160px, 1fr));
  }
  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

export const Field = styled.div<{ $invalid?: boolean }>`
  background: ${({ theme }) => theme.colors.neutral.white};
  border: 1px solid
    ${({ theme, $invalid }) => ($invalid ? theme.colors.action.error : theme.colors.neutral.greyBlue)};
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: border-color .15s ease;

  label {
    font-size: 13px;
    color: ${({ theme }) => theme.colors.neutral.grey};
  }
`;

export const Counter = styled.div`
  display: inline-flex;
  align-items: center;
  border: 1px solid ${({ theme }) => theme.colors.neutral.greyBlue};
  border-radius: 10px;
  overflow: hidden;
  width: 100%;

  button {
    appearance: none;
    border: 0;
    background: ${({ theme }) => theme.colors.tint.t5};
    padding: 8px 12px;
    cursor: pointer;
    font-weight: 700;
    line-height: 1;
    transition: background .15s ease;
  }
  button:hover { filter: brightness(0.95); }

  input {
    flex: 1;
    min-width: 0;
    text-align: center;
    border: 0;
    outline: none;
    padding: 8px 6px;
    font-size: 14px;
  }

  /* ukrycie spinnerów */
  input[type=number]::-webkit-outer-spin-button,
  input[type=number]::-webkit-inner-spin-button {
    -webkit-appearance: none; margin: 0;
  }
  input[type=number] { -moz-appearance: textfield; }
`;

export const SmallNote = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.neutral.grey};
`;

export const HelpRow = styled.div`
  margin-top: 6px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.neutral.grey};
`;

export const Divider = styled.hr`
  border: 0;
  height: 1px;
  background: ${({ theme }) => theme.colors.neutral.silver};
  margin: 8px 0 4px;
`;

export const DistributionBar = styled.div<{ $disabled?: boolean }>`
  position: relative;
  height: 12px;
  border-radius: 999px;
  background: #eef4ee;                 /* bardzo jasne oliwkowo-miętowe */
  box-shadow: inset 0 0 0 1px rgba(0,0,0,0.06);
  overflow: hidden;
  display: flex;
  gap: 0;                               /* segmenty stykają się bez przerw */
  opacity: ${({ $disabled }) => ($disabled ? 0.6 : 1)};
`;

export const DistributionSegment = styled.div<{ $w: number; $bg: string }>`
  flex: 0 0 ${({ $w }) => Math.max(0, Math.min($w, 100))}%;
  background: ${({ $bg }) => $bg};
  transition: flex-basis 220ms ease;
`;

export const PALETTE = {
  diff: {
    easyBg: "rgba(76, 175, 80, 0.12)",
    easyFg: "#2e7d32",
    medBg:  "rgba(255, 193, 7, 0.14)",
    medFg:  "#f57f17",
    hardBg: "rgba(244, 67, 54, 0.16)",
    hardFg: "#c62828",
  },
  type: {
    closedBg: "rgba(33, 150, 243, 0.12)",
    closedFg: "#1565c0",
    openBg:   "rgba(156, 39, 176, 0.12)",
    openFg:   "#6a1b9a",
  },
  total: {
    bg: "rgba(139, 160, 81, 0.16)", // #8BA051 z delikatną alfą
    fg: "#556B2F",         
  },
};

export const Pill = styled.span<{ $bg?: string; $fg?: string }>`
  padding: 6px 12px;
  border-radius: 999px;
  font-weight: 600;
  font-size: 12px;
  background: ${({ $bg }) => $bg || "rgba(0,0,0,.06)"};
  color: ${({ $fg }) => $fg || "#333"};
  white-space: nowrap;
`;
