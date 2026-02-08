import styled from "styled-components";
import { NAVBAR_HEIGHT, NAVBAR_HEIGHT_MOBILE } from "../Navbar/Navbar.styles";

export const SidebarWrapper = styled.aside<{ $isDrawerOpen?: boolean; $isHidden?: boolean }>`
  display: flex;
  flex-direction: column;
  padding: 24px;
  background-color: ${({ theme }) => theme.colors.neutral.white};
  box-shadow: ${({ theme, $isHidden }) => ($isHidden ? "none" : theme.shadows["2px"])};
  width: 280px;
  height: 100%; 
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), 
              width 0.4s cubic-bezier(0.16, 1, 0.3, 1), 
              padding 0.4s cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow 0.4s ease;
  position: relative;
  z-index: 100;

  ${({ $isHidden }) => $isHidden && `
    width: 0;
    padding: 24px 0;
    transform: translateX(-100%);
  `}

  @media (max-width: 1024px) {
    position: fixed;
    top: calc(${NAVBAR_HEIGHT}px + env(safe-area-inset-top));
    left: 0;
    height: calc(100dvh - ${NAVBAR_HEIGHT}px - env(safe-area-inset-top));
    max-height: calc(100dvh - ${NAVBAR_HEIGHT}px - env(safe-area-inset-top));
    width: 280px;
    max-width: 82vw;
    transform: translateX(${({ $isDrawerOpen }) => ($isDrawerOpen ? "0" : "-100%")});
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 1200;
    border-right: 1px solid ${({ theme }) => theme.colors.neutral.greyBlue};
    padding-bottom: calc(24px + env(safe-area-inset-bottom));
    padding-left: 24px;
    padding-right: 24px;
    overflow: hidden;
  }

  @media (max-width: 768px) {
    top: calc(${NAVBAR_HEIGHT_MOBILE}px + env(safe-area-inset-top));
    height: calc(100dvh - ${NAVBAR_HEIGHT_MOBILE}px - env(safe-area-inset-top));
    max-height: calc(100dvh - ${NAVBAR_HEIGHT_MOBILE}px - env(safe-area-inset-top));
  }
`;

export const ToggleButton = styled.button<{ $isHidden?: boolean }>`
  position: absolute;
  top: 50%;
  right: -12px;
  transform: translate(${({ $isHidden }) => ($isHidden ? "40px" : "0")}, -50%);
  width: 28px;
  height: 56px;
  background-color: ${({ theme }) => theme.colors.neutral.white};
  border: 1px solid ${({ theme }) => theme.colors.neutral.greyBlue};
  border-radius: ${({ $isHidden }) => ($isHidden ? "0 12px 12px 0" : "12px 0 0 12px")};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 110;
  box-shadow: ${({ $isHidden }) => ($isHidden ? "4px 0 10px rgba(0,0,0,0.08)" : "-2px 0 5px rgba(0,0,0,0.05)")};
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  padding: 0;

  &:hover {
    background-color: ${({ theme }) => theme.colors.tint.t5};
    width: 32px;
    border-color: ${({ theme }) => theme.colors.brand.primary};
  }

  @media (max-width: 1024px) {
    display: none;
  }

  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-top: 2px solid ${({ theme }) => theme.colors.brand.primary};
    border-right: 2px solid ${({ theme }) => theme.colors.brand.primary};
    transform: rotate(${({ $isHidden }) => ($isHidden ? "45deg" : "225deg")});
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }
`;

export const SidebarInner = styled.div<{ $isHidden?: boolean }>`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 232px; /* 280px - 48px padding */
  flex-shrink: 0;
  opacity: ${({ $isHidden }) => ($isHidden ? 0 : 1)};
  visibility: ${({ $isHidden }) => ($isHidden ? "hidden" : "visible")};
  transition: opacity 0.3s ease, visibility 0.3s ease;
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
