import styled, { css } from "styled-components";

type InputSize = "sm" | "md" | "lg";

export interface InputProps {
  $fullWidth?: boolean;
  $size?: InputSize;
}

const sizeStyles = {
  sm: css`
    padding: 8px 10px;
    font-size: 13px;
  `,
  md: css`
    padding: 10px 12px;
    font-size: 14px;
  `,
  lg: css`
    padding: 12px 14px;
    font-size: 15px;
  `,
};

export const Input = styled.input<InputProps>`
  width: ${({ $fullWidth }) => ($fullWidth ? "100%" : "auto")};
  border-radius: ${({ theme }) => theme.radii.sm};
  border: 1px solid ${({ theme }) => theme.colors.neutral.greyBlue};
  background: #fff;
  ${({ $size = "md" }) => sizeStyles[$size]}
  font-family: inherit;
  line-height: 1.4;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:focus {
    outline: none;
    border-color: #64b5f6;
    box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.15);
  }

  &:disabled {
    background: #f5f5f5;
    color: ${({ theme }) => theme.colors.neutral.grey};
    cursor: not-allowed;
  }
`;

Input.defaultProps = {
  $size: "md",
};

export default Input;
