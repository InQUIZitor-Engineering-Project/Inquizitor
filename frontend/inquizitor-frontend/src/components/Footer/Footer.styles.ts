import styled from "styled-components";

export const FooterContainer = styled.footer`
  width: 100%;
  background-color: ${({ theme }) => theme.colors.neutral.silver};
  padding: 24px ${({ theme }) => theme.grid.margin};
  margin-top: 20px;
`;

export const FooterText = styled.p`
  ${({ theme }) => `
    font-family: ${theme.typography.body.regular.body4.fontFamily};
    font-size: ${theme.typography.body.regular.body4.fontSize};
    font-weight: ${theme.typography.body.regular.body4.fontWeight};
    line-height: ${theme.typography.body.regular.body4.lineHeight};
    color: ${theme.colors.neutral.grey};
  `}
  text-align: center;
`;
