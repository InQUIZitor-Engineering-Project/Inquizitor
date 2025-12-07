import styled from "styled-components";
import { Link } from "react-router-dom";

export const NAVBAR_HEIGHT = 80;

export const NavbarContainer = styled.nav`
  width: 100%;
  min-height: ${NAVBAR_HEIGHT}px;
  height: auto;

  padding: 12px 0;
  display: flex;
  align-items: center;
  background-color: ${({ theme }) => theme.colors.neutral.white};
  box-shadow: ${({ theme }) => theme.shadows["2px"]};
  box-sizing: border-box;
  z-index: 100;
  position: relative;   /* nie fixed */
  flex-shrink: 0;

  @media (max-width: 900px) {
    padding: 10px 0;
  }

  @media (max-width: 768px) {
    min-height: 64px;
    padding: 8px 0;
  }
`;

export const NavHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;

  @media (min-width: 769px) {
    display: none;
  }
`;

export const SidebarToggleButton = styled.button`
  display: none;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.brand.primary};
  background: ${({ theme }) => theme.colors.neutral.white};
  color: ${({ theme }) => theme.colors.brand.primary};
  font-weight: 600;

  @media (max-width: 1024px) {
    display: inline-flex;
  }
`;

export const MobileToggle = styled.button`
  display: none;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 8px;
  border: none;
  background: ${({ theme }) => theme.colors.neutral.white};

  @media (max-width: 768px) {
    display: inline-flex;
  }
`;

export const NavContent = styled.div<{ $open: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 8px;

  @media (max-width: 768px) {
    position: absolute;
    left: 0;
    right: 0;
    top: 100%;
    margin-top: 0;
    width: 100%;
    padding: 12px 16px;
    background: ${({ theme }) => theme.colors.neutral.white};
    box-shadow: ${({ theme }) => theme.shadows["4px"]};
    border-top: none;
    border-radius: 0 0 12px 12px;
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    display: ${({ $open }) => ($open ? "flex" : "none")};
    z-index: 101;
  }

  @media (min-width: 769px) {
    display: none;
  }
`;

export const DesktopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-width: 0;

  @media (max-width: 768px) {
    display: none;
  }
`;

export const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;     /* zawijaj linki */
  min-width: 0;        /* pozwól się ściskać */
  justify-content: center;
  flex: 1;             /* zajmij środkową przestrzeń między logo a przyciskami */

  @media (max-width: 720px) {
    gap: 16px;
  }

  @media (max-width: 768px) {
    width: 100%;
    flex: unset;
    flex-direction: column;
    align-items: center;
    gap: 12px;

    > a {
      width: 100%;
      text-align: center;
      padding: 10px 12px;
      border-radius: 4px;
      background: ${({ theme }) => theme.colors.tint.t5};
      color: ${({ theme }) => theme.colors.neutral.dGrey};
      transition: background-color 0.2s;
    }

    > a:hover {
      background: ${({ theme }) => theme.colors.tint.t4};
    }
  }
`;

export const StyledLink = styled(Link)`
  ${({ theme }) => `
    font-family: ${theme.typography.body.medium.body2.fontFamily};
    font-size: ${theme.typography.body.medium.body2.fontSize};
    font-weight: ${theme.typography.body.medium.body2.fontWeight};
    line-height: ${theme.typography.body.medium.body2.lineHeight};
    color: ${theme.colors.neutral.lGrey};
  `}
  white-space: nowrap;      /* żeby się nie łamały słowa w połowie */
  transition: color 0.2s;

  &:hover {
    color: ${({ theme }) => theme.colors.brand.primary};
  }
`;

export const ButtonGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;   /* jak mało miejsca – spadnij do nowej linii */

  @media (max-width: 768px) {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;

    > * {
      width: 100%;
      text-align: center;
      justify-content: center;
      display: inline-flex;
      align-items: center;
    }
  }
`;

export const LoginLink = styled.a`
  ${({ theme }) => `
    font-family: ${theme.typography.body.medium.body2.fontFamily};
    font-size: ${theme.typography.body.medium.body2.fontSize};
    font-weight: ${theme.typography.body.medium.body2.fontWeight};
    color: ${theme.colors.brand.secondary};
  `}
  padding: 8px 12px;
  border-radius: 4px;
  white-space: nowrap;

  &:hover {
    background-color: ${({ theme }) => theme.colors.tint.t5};
  }

  @media (max-width: 768px) {
    border: 1px solid ${({ theme }) => theme.colors.brand.primary};
    background: transparent;
    color: ${({ theme }) => theme.colors.brand.primary};
    padding: 10px 14px;

    &:hover {
      background-color: ${({ theme }) => theme.colors.tint.t5};
    }
  }
`;

export const RegisterButton = styled.a`
  ${({ theme }) => `
    font-family: ${theme.typography.body.medium.body2.fontFamily};
    font-size: ${theme.typography.body.medium.body2.fontSize};
    font-weight: ${theme.typography.body.medium.body2.fontWeight};
  `}
  background-color: ${({ theme }) => theme.colors.brand.primary};
  color: ${({ theme }) => theme.colors.neutral.white};
  padding: 10px 20px;
  border-radius: 4px;
  box-shadow: ${({ theme }) => theme.shadows["2px"]};
  transition: background-color 0.2s, box-shadow 0.2s;
  white-space: nowrap;

  &:hover {
    background-color: ${({ theme }) => theme.colors.shade.s1};
    box-shadow: ${({ theme }) => theme.shadows["4px"]};
  }
`;
