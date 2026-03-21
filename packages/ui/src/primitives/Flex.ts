import styled, { css } from "styled-components";
import { Box } from "./Box";
import type { BoxProps } from "./Box";

export interface FlexProps extends BoxProps {
  $align?: string;
  $justify?: string;
  $direction?: "row" | "column";
  $wrap?: "wrap" | "nowrap" | "wrap-reverse";
  $inline?: boolean;
}

export const Flex = styled(Box)<FlexProps>`
  display: ${({ $inline }) => ($inline ? "inline-flex" : "flex")};
  ${({ $direction }) => $direction && css`flex-direction: ${$direction};`}
  ${({ $align }) => $align && css`align-items: ${$align};`}
  ${({ $justify }) => $justify && css`justify-content: ${$justify};`}
  ${({ $wrap }) => $wrap && css`flex-wrap: ${$wrap};`}
`;

export default Flex;
