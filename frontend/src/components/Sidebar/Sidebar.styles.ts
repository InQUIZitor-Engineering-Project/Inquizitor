import styled from "styled-components";
import { NAVBAR_HEIGHT, NAVBAR_HEIGHT_MOBILE } from "../Navbar/Navbar.styles";

export const SidebarWrapper = styled.aside<{ $isDrawerOpen?: boolean }>`
  display: flex;
  flex-direction: column;
  padding: 24px;
  background-color: ${({ theme }) => theme.colors.neutral.white};
  box-shadow: ${({ theme }) => theme.shadows["2px"]};
  width: 280px;
  height: 100%; 
  overflow: hidden;

  @media (max-width: 1024px) {
    position: fixed;
    top: calc(${NAVBAR_HEIGHT}px + env(safe-area-inset-top));
    left: 0;
    height: calc(100dvh - ${NAVBAR_HEIGHT}px - env(safe-area-inset-top));
    max-height: calc(100dvh - ${NAVBAR_HEIGHT}px - env(safe-area-inset-top));
    width: 280px;
    max-width: 82vw;
    transform: translateX(${({ $isDrawerOpen }) => ($isDrawerOpen ? "0" : "-100%")});
    transition: transform 0.25s ease, box-shadow 0.25s ease;
    z-index: 1200;
    border-right: 1px solid ${({ theme }) => theme.colors.neutral.greyBlue};
    padding-bottom: calc(24px + env(safe-area-inset-bottom));
  }

  @media (max-width: 768px) {
    top: calc(${NAVBAR_HEIGHT_MOBILE}px + env(safe-area-inset-top));
    height: calc(100dvh - ${NAVBAR_HEIGHT_MOBILE}px - env(safe-area-inset-top));
    max-height: calc(100dvh - ${NAVBAR_HEIGHT_MOBILE}px - env(safe-area-inset-top));
  }
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

export const DeleteIcon = styled.img`
  visibility: hidden;
  opacity: 0;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;

  /* Set a fixed size for the icon */
  width: 24px; /* Adjust as needed */
  height: 24px; /* Adjust as needed */
  object-fit: contain; /* Ensures the image scales properly */

  &:hover {
    background-color: ${({ theme }) => theme.colors.tint.t5 || '#ffebee'};
  }
`;

export const TestItem = styled.div`
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;

  display: flex;
  justify-content: space-between;
  align-items: center;

  &:hover {
    background-color: ${({ theme }) => theme.colors.tint.t5};

    ${DeleteIcon} {
      visibility: visible;
      opacity: 1;
    }
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
