import styled from "styled-components";

export const SectionCard = styled.div`
  background-color: ${({ theme }) => theme.colors.neutral.white};
  border-radius: 16px;
  padding: 24px 24px 20px;
  box-shadow: ${({ theme }) => theme.shadows["4px"]};
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export default SectionCard;
