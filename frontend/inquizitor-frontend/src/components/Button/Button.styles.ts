// src/components/Button/Button.styles.ts
import styled, { css } from "styled-components";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
}

export const StyledButton = styled.button<ButtonProps>`
  ${({ theme, variant }) => {
    switch (variant) {
      case "primary":
        return css`
          background-color: ${theme.colors.brand.primary};
          color: ${theme.colors.neutral.white};
          box-shadow: ${theme.shadows["2px"]};
          &:hover {
            background-color: ${theme.colors.shade.s1};
            box-shadow: ${theme.shadows["4px"]};
          }
        `;
      case "secondary":
        return css`
          background-color: ${theme.colors.brand.secondary};
          color: ${theme.colors.neutral.white};
          box-shadow: ${theme.shadows["2px"]};
          &:hover {
            background-color: ${theme.colors.neutral.dGrey};
            box-shadow: ${theme.shadows["4px"]};
          }
        `;
      case "outline":
        return css`
          background-color: transparent;
          color: ${theme.colors.brand.primary};
          border: 2px solid ${theme.colors.brand.primary};
          &:hover {
            background-color: ${theme.colors.tint.t5};
          }
        `;
      default:
        return "";
    }
  }}

  ${({ theme }) => `
    font-family: ${theme.typography.body.medium.body2.fontFamily};
    font-size: ${theme.typography.body.medium.body2.fontSize};
    font-weight: ${theme.typography.body.medium.body2.fontWeight};
    line-height: ${theme.typography.body.medium.body2.lineHeight};
  `}

  padding: 12px 24px;
  border-radius: 4px;
  transition: background-color 0.2s, box-shadow 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;
