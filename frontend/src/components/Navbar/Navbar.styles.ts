import styled from "styled-components";
import { Link } from "react-router-dom";

export const NAVBAR_HEIGHT = 80;

export const NavbarContainer = styled.nav`
  width: 100%;
  /* zamiast sztywnej wysokości – elastyczna: */
  min-height: ${NAVBAR_HEIGHT}px;
  height: auto;

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;            /* miejsce gdy się zawija */
  padding: 16px ${({ theme }) => theme.grid.margin};
  background-color: ${({ theme }) => theme.colors.neutral.white};
  box-shadow: ${({ theme }) => theme.shadows["2px"]};
  box-sizing: border-box;
  z-index: 100;

  position: relative;   /* nie fixed */
  flex-shrink: 0;

  /* pozwól elementom przechodzić do nowej linii */
  flex-wrap: wrap;

  /* drobne dostosowanie na węższych ekranach */
  @media (max-width: 900px) {
    padding: 12px ${({ theme }) => theme.grid.margin};
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
