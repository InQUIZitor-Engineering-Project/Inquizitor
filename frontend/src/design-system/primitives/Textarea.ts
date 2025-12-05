import styled, { css } from "styled-components";

type TextareaSize = "sm" | "md" | "lg";

export interface TextareaProps {
  $fullWidth?: boolean;
  $size?: TextareaSize;
  $minHeight?: string;
}

const sizeStyles = {
  sm: css`
    padding: 10px 12px;
    font-size: 13px;
  `,
  md: css`
    padding: 12px 14px;
    font-size: 14px;
  `,
  lg: css`
    padding: 14px 16px;
    font-size: 15px;
  `,
};

export const Textarea = styled.textarea<TextareaProps>`
  width: ${({ $fullWidth }) => ($fullWidth ? "100%" : "auto")};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.neutral.greyBlue};
  background: #fff;
  ${({ $size = "md" }) => sizeStyles[$size]}
  font-family: inherit;
  line-height: 1.5;
  resize: vertical;
  min-height: ${({ $minHeight }) => $minHeight || "120px"};
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

Textarea.defaultProps = {
  $size: "md",
};

export default Textarea;
