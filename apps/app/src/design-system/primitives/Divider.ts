import styled from "styled-components";

export const Divider = styled.div`
  height: 1px;
  width: 100%;
  background: ${({ theme }) => theme.colors.neutral.greyBlue};
`;

export default Divider;
