import styled from "styled-components";
import { Flex } from "./Flex";
import type { FlexProps } from "./Flex";

export const Toolbar = styled(Flex).attrs<FlexProps>(() => ({
  $align: "center",
  $justify: "space-between",
  $gap: "sm",
}))``;

export default Toolbar;
