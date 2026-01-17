import React, { useState } from "react";
import styled, { css } from "styled-components";
import { Box, Text } from "../primitives";

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  disabled?: boolean;
}

const TooltipContainer = styled(Box)`
  position: relative;
  display: inline-flex;
`;

const TooltipContent = styled.div<{ $visible: boolean }>`
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 12px;
  padding: 8px 14px;
  background: #ffffff;
  color: #1f2937;
  border: 1px solid #d1d5db;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
  white-space: pre-wrap;
  width: max-content;
  max-width: 280px;
  z-index: 10000;
  pointer-events: none;
  visibility: hidden;
  opacity: 0;
  transition:
    opacity 0.2s ease-in-out,
    visibility 0.2s,
    transform 0.2s ease-out;
  box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 10px -2px rgba(0, 0, 0, 0.05);

  ${({ $visible }) =>
    $visible &&
    css`
      visibility: visible;
      opacity: 1;
      transform: translateX(-50%) translateY(-4px);
    `}

  &::after {
    content: "";
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-width: 6px;
    border-style: solid;
    border-color: #ffffff transparent transparent transparent;
  }

  &::before {
    content: "";
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-width: 7px;
    border-style: solid;
    border-color: #d1d5db transparent transparent transparent;
  }
`;

const Tooltip: React.FC<TooltipProps> = ({ content, children, disabled = false }) => {
  const [visible, setVisible] = useState(false);

  if (disabled || !content) {
    return <>{children}</>;
  }

  return (
    <TooltipContainer
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      <TooltipContent $visible={visible}>
        {typeof content === "string" ? (
          <Text $variant="body4" style={{ color: "inherit", fontWeight: "inherit" }}>
            {content}
          </Text>
        ) : (
          content
        )}
      </TooltipContent>
    </TooltipContainer>
  );
};

export default Tooltip;

