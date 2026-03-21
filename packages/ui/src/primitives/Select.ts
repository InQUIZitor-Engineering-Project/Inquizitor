import styled, { css } from "styled-components";

type SelectSize = "sm" | "md" | "lg";

export interface SelectProps {
  $fullWidth?: boolean;
  $size?: SelectSize;
}

const sizeStyles = {
  sm: css`
    padding: 6px 10px;
    font-size: 12px;
  `,
  md: css`
    padding: 8px 12px;
    font-size: 13px;
  `,
  lg: css`
    padding: 10px 14px;
    font-size: 14px;
  `,
};

export const Select = styled.select<SelectProps>`
  width: ${({ $fullWidth }) => ($fullWidth ? "100%" : "auto")};
  border-radius: ${({ theme }) => theme.radii.sm};
  border: 1px solid ${({ theme }) => theme.colors.neutral.greyBlue};
  background: ${({ theme }) => theme.colors.neutral.white};
  color: ${({ theme }) => theme.colors.neutral.black};
  ${({ $size = "md" }) => sizeStyles[$size]}
  font-family: inherit;
  line-height: 1.4;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.brand.info};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.tint.t5};
  }

  &:disabled {
    background: ${({ theme }) => theme.colors.neutral.silver};
    color: ${({ theme }) => theme.colors.neutral.grey};
    cursor: not-allowed;
  }
`;

Select.defaultProps = {
  $size: "md",
};

export default Select;
