import styled from "styled-components";

export const SidebarWrapper = styled.aside`
  display: flex;
  flex-direction: column;
  padding: 24px;
  background-color: ${({ theme }) => theme.colors.neutral.white};
  box-shadow: ${({ theme }) => theme.shadows["2px"]};
  width: 280px;
  height: calc(100vh - 80px); /* fixed height */
  overflow: hidden;
`;

export const SearchInput = styled.input`
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.colors.neutral.greyBlue};
  border-radius: 8px;
  margin-bottom: 24px;
  outline: none;
`;

export const TestList = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const TestItem = styled.div`
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  &:hover {
    background-color: ${({ theme }) => theme.colors.tint.t5};
  }
`;

export const CreateNewButton = styled.button`
  ${({ theme }) => `
    font-family: ${theme.typography.body.medium.body2.fontFamily};
    font-size: ${theme.typography.body.medium.body2.fontSize};
    font-weight: ${theme.typography.body.medium.body2.fontWeight};
  `}
  background-color: ${({ theme }) => theme.colors.brand.primary};
  color: ${({ theme }) => theme.colors.neutral.white};
  padding: 12px;
  border: none;
  border-radius: 8px;
  margin-top: 16px;
  cursor: pointer;
  box-shadow: ${({ theme }) => theme.shadows["2px"]};
`;
