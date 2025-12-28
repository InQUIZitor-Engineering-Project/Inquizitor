import React from "react";
import styled from "styled-components";

export interface CloseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  $size?: number;
  $top?: string | number;
  $right?: string | number;
  $hideOnMobile?: boolean;
}

const StyledCloseButton = styled.button<CloseButtonProps>`
  position: absolute;
  top: ${({ $top = "12px" }) => (typeof $top === "number" ? `${$top}px` : $top)};
  right: ${({ $right = "12px" }) => (typeof $right === "number" ? `${$right}px` : $right)};
  width: ${({ $size = 24 }) => $size}px;
  height: ${({ $size = 24 }) => $size}px;
  display: ${({ $hideOnMobile }) => ($hideOnMobile ? "none" : "flex")};
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: ${({ theme }) => theme.colors.neutral.grey};
  transition: all 0.2s;
  cursor: pointer;
  z-index: 10;
  border: none;
  background: transparent;
  padding: 0;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
    color: ${({ theme }) => theme.colors.neutral.black};
  }

  @media (min-width: 600px) {
    display: flex;
    top: ${({ $top = "16px" }) => (typeof $top === "number" ? `${$top}px` : $top)};
    right: ${({ $right = "16px" }) => (typeof $right === "number" ? `${$right}px` : $right)};
  }
`;

export const CloseButton: React.FC<CloseButtonProps> = (props) => {
  return (
    <StyledCloseButton {...props}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13 1L1 13M1 1L13 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </StyledCloseButton>
  );
};

export default CloseButton;

