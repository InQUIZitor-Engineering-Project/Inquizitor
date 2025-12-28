import styled, { css } from "styled-components";
import type { DefaultTheme } from "styled-components";

type ButtonVariant = "primary" | "info" | "ghost" | "outline" | "danger" | "success";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps {
  $variant?: ButtonVariant;
  $size?: ButtonSize;
  $fullWidth?: boolean;
}

const sizeStyles = {
  sm: css`
    padding: 6px 12px;
    font-size: 12px;
  `,
  md: css`
    padding: 9px 14px;
    font-size: 13px;
  `,
  lg: css`
    padding: 12px 18px;
    font-size: 14px;
  `,
};

const variantStyles = (theme: DefaultTheme, variant: ButtonVariant) => {
  const base = css`
    border: none;
    color: #ffffff;
    background: ${theme.colors.brand.primary};
    box-shadow: ${theme.elevation.md};
    &:hover {
      transform: translateY(-1px);
      box-shadow: ${theme.elevation.lg};
    }
  `;

  const info = css`
    color: #ffffff;
    background: ${theme.colors.brand.info};
    border: none;
    box-shadow: ${theme.elevation.md};
    &:hover {
      transform: translateY(-1px);
      box-shadow: ${theme.elevation.lg};
      background: #1e88e5;
    }
  `;

  const ghost = css`
    background: ${theme.colors.neutral.silver};
    color: ${theme.colors.neutral.dGrey};
    border: 1px solid ${theme.colors.neutral.whiteStroke};
    box-shadow: none;
    &:hover {
      background: #eef2f5;
      border-color: ${theme.colors.neutral.greyBlue};
      color: ${theme.colors.neutral.black};
      box-shadow: ${theme.elevation.sm};
    }
  `;

  const outline = css`
    background: transparent;
    color: ${theme.colors.brand.primary};
    border: 1px solid rgba(76, 175, 80, 0.5);
    box-shadow: none;
    &:hover {
      background: rgba(76, 175, 80, 0.08);
    }
  `;

  const danger = css`
    background: ${theme.colors.danger.bg};
    color: ${theme.colors.danger.main};
    border: 1px solid ${theme.colors.danger.border};
    box-shadow: none;
    &:hover {
      background: ${theme.colors.danger.hover};
      box-shadow: 0 3px 8px ${theme.colors.danger.shadow};
    }
  `;

  const success = css`
    background: rgba(76, 175, 80, 0.1);
    color: ${theme.colors.shade.s2};
    border: 1px solid rgba(76, 175, 80, 0.3);
    box-shadow: none;
    &:hover {
      background: rgba(76, 175, 80, 0.16);
      box-shadow: 0 3px 8px rgba(76, 175, 80, 0.18);
    }
  `;

  switch (variant) {
    case "ghost":
      return ghost;
    case "outline":
      return outline;
    case "danger":
      return danger;
    case "success":
      return success;
    case "info":
      return info;
    default:
      return base;
  }
};

export const Button = styled.button<ButtonProps>`
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-weight: 600;
  line-height: 1.2;
  transition: all 0.15s ease-in-out;
  ${({ $fullWidth }) => $fullWidth && css`width: 100%;`}
  ${({ $size = "md" }) => sizeStyles[$size]}
  ${({ theme, $variant = "primary" }) => variantStyles(theme, $variant)}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

Button.defaultProps = {
  $variant: "primary",
  $size: "md",
};

export default Button;
