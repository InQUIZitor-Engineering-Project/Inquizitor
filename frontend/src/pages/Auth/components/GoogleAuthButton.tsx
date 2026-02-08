import React from "react";
import styled from "styled-components";
import googleIcon from "../../../assets/icons/google.webp";

const StyledButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  padding: 12px 18px;
  font-size: 14px;
  font-weight: 500;
  color: #374151; /* gray-700 */
  background: #ffffff;
  border: 1px solid #d1d5db; /* gray-300 */
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s;

  &:hover {
    background: #f9fafb;
    border-color: #9ca3af;
  }
`;

const Icon = styled.img`
  width: 20px;
  height: 20px;
  flex-shrink: 0;
`;

interface GoogleAuthButtonProps {
  children: React.ReactNode;
  onClick: () => void;
}

const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({ children, onClick }) => (
  <StyledButton type="button" onClick={onClick}>
    <Icon src={googleIcon} alt="" aria-hidden />
    <span>{children}</span>
  </StyledButton>
);

export default GoogleAuthButton;
