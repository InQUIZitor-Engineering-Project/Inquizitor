import styled from "styled-components";

export const PageWrapper = styled.div`
  min-height: 100vh;
  width: 100%;
  background-color: ${({ theme }) => theme.colors.tint.t4};
  display: flex;
  flex-direction: column; 
`;


export const MainContent = styled.main`
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  box-sizing: border-box;
`;

export const Card = styled.div`
  background-color: ${({ theme }) => theme.colors.neutral.white};
  border-radius: 16px;
  box-shadow: ${({ theme }) => theme.shadows["8px"]};
  padding: 40px;
  max-width: 900px;
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr; /* dwie kolumny: formularz + ilustracja */
  gap: ${({ theme }) => theme.grid.gutter};
`;

export const LeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

export const LogoWrapper = styled.div`
  width: 140px;
  img {
    width: 100%;
    object-fit: contain;
  }
`;

export const Title = styled.h2`
  ${({ theme }) => `
    font-family: ${theme.typography.heading.h3.fontFamily};
    font-size: ${theme.typography.heading.h3.fontSize};
    font-weight: ${theme.typography.heading.h3.fontWeight};
    line-height: ${theme.typography.heading.h3.lineHeight};
    color: ${theme.colors.neutral.dGrey};
  `}
`;

export const Subtitle = styled.p`
  ${({ theme }) => `
    font-family: ${theme.typography.body.regular.body3.fontFamily};
    font-size: ${theme.typography.body.regular.body3.fontSize};
    font-weight: ${theme.typography.body.regular.body3.fontWeight};
    line-height: ${theme.typography.body.regular.body3.lineHeight};
    color: ${theme.colors.neutral.grey};
  `}
  a {
    color: ${({ theme }) => theme.colors.brand.primary};
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
`;

export const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr; 
  gap: 16px;
`;

export const FullWidthField = styled.div`
  grid-column: span 2;
`;

export const FieldLabel = styled.label`
  ${({ theme }) => `
    font-family: ${theme.typography.body.regular.body3.fontFamily};
    font-size: ${theme.typography.body.regular.body3.fontSize};
    font-weight: ${theme.typography.body.regular.body3.fontWeight};
    line-height: ${theme.typography.body.regular.body3.lineHeight};
    color: ${theme.colors.neutral.grey};
  `}
  margin-bottom: 4px;
  display: block;
`;

export const TextInput = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid ${({ theme }) => theme.colors.neutral.greyBlue};
  border-radius: 8px;
  ${({ theme }) => `
    font-family: ${theme.typography.body.regular.body1.fontFamily};
    font-size: ${theme.typography.body.regular.body1.fontSize};
    font-weight: ${theme.typography.body.regular.body1.fontWeight};
    line-height: ${theme.typography.body.regular.body1.lineHeight};
    color: ${theme.colors.neutral.dGrey};
  `}
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: ${({ theme }) => theme.colors.brand.primary};
  }
`;

export const CheckboxWrapper = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  grid-column: span 2;

  input {
    accent-color: ${({ theme }) => theme.colors.brand.primary};
    width: 16px;
    height: 16px;
  }

  span {
    ${({ theme }) => `
      font-family: ${theme.typography.body.regular.body3.fontFamily};
      font-size: ${theme.typography.body.regular.body3.fontSize};
      font-weight: ${theme.typography.body.regular.body3.fontWeight};
      line-height: ${theme.typography.body.regular.body3.lineHeight};
      color: ${theme.colors.neutral.grey};
    `}
  }
`;

export const SubmitButtonWrapper = styled.div`
  grid-column: span 2;
  margin-top: 8px;
`;

export const RightColumn = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const Illustration = styled.img`
  width: 100%;
  max-width: 400px;
  object-fit: contain;
`;

export const ErrorMessage = styled.p`
  ${({ theme }) => `
    font-family: ${theme.typography.body.regular.body3.fontFamily};
    font-size: ${theme.typography.body.regular.body3.fontSize};
    font-weight: ${theme.typography.body.regular.body3.fontWeight};
    color: ${theme.colors.action.error};
  `}
  grid-column: span 2;
  margin-top: -8px;
  margin-bottom: 8px;
`;

