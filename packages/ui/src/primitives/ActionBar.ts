import styled from "styled-components";
import { Flex } from "./Flex";
import type { FlexProps } from "./Flex";

export const ActionBar = styled(Flex).attrs<FlexProps>(() => ({
  $align: "center",
  $justify: "flex-end",
  $gap: "sm",
  $wrap: "wrap",
}))``;

export default ActionBar;
