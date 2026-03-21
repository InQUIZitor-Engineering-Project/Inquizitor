import styled, { css } from "styled-components";
import { Flex } from "./Flex";
import type { FlexProps } from "./Flex";

export interface StackProps extends Omit<FlexProps, "$direction"> {
  $gap?: FlexProps["$gap"];
}

export const Stack = styled(Flex).attrs<StackProps>(() => ({
  $direction: "column",
}))<StackProps>`
  ${({ theme, $gap }) =>
    $gap &&
    css`
      gap: ${typeof $gap === "string" && $gap in theme.spacing
        ? theme.spacing[$gap as keyof typeof theme.spacing]
        : $gap};
    `}
`;

Stack.defaultProps = {
  $gap: "md",
};

export default Stack;
