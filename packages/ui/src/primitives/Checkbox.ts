import styled from "styled-components";

export interface CheckboxProps {
  $size?: number;
}

export const Checkbox = styled.input.attrs({ type: "checkbox" })<CheckboxProps>`
  width: ${({ $size = 18 }) => `${$size}px`};
  height: ${({ $size = 18 }) => `${$size}px`};
  accent-color: ${({ theme }) => theme.colors.brand.primary};
  cursor: pointer;
  flex-shrink: 0;
  margin: 0;
`;

export default Checkbox;
