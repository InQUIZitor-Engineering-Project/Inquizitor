import styled from "styled-components";
import { Link } from "react-router-dom";

export const NavbarContainer = styled.nav`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px ${({ theme }) => theme.grid.margin};
  background-color: ${({ theme }) => theme.colors.neutral.white};
  box-shadow: ${({ theme }) => theme.shadows["2px"]};
  position: sticky;
  top: 0;
  z-index: 100;
`;

export const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 32px;
`;

export const StyledLink = styled(Link)`
  ${({ theme }) => `
  font-family: ${theme.typography.body.medium.body2.fontFamily};
  font-size: ${theme.typography.body.medium.body2.fontSize};
  font-weight: ${theme.typography.body.medium.body2.fontWeight};
  line-height: ${theme.typography.body.medium.body2.lineHeight};
  color: ${theme.colors.neutral.lGrey};
  `}
  transition: color 0.2s;

  &:hover {
    color: ${props => props.theme.colors.brand.primary};
  }
`;

export const ButtonGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
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

  &:hover {
    background-color: ${({ theme }) => theme.colors.shade.s1};
    box-shadow: ${({ theme }) => theme.shadows["4px"]};
  }
`;


