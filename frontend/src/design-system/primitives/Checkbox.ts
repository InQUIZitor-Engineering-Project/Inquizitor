import styled from "styled-components";

export interface CheckboxProps {
  $size?: number;
}

export const Checkbox = styled.input.attrs({ type: "checkbox" })<CheckboxProps>`
  width: ${({ $size = 16 }) => `${$size}px`};
  height: ${({ $size = 16 }) => `${$size}px`};
  accent-color: ${({ theme }) => theme.colors.brand.primary};
  cursor: pointer;
`;

export default Checkbox;
