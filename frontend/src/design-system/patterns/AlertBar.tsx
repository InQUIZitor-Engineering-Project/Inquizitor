import React from "react";
import styled, { css } from "styled-components";
import { Flex, Text } from "../primitives";

type AlertVariant = "info" | "success" | "warning" | "danger";

export interface AlertBarProps {
  variant?: AlertVariant;
  children: React.ReactNode;
}

const variantStyles = {
  info: css`
    color: #1565c0;
    background: rgba(33, 150, 243, 0.12);
    border: 1px solid rgba(33, 150, 243, 0.3);
  `,
  success: css`
    color: #2e7d32;
    background: rgba(76, 175, 80, 0.12);
    border: 1px solid rgba(76, 175, 80, 0.3);
  `,
  warning: css`
    color: #b76e00;
    background: rgba(251, 192, 45, 0.16);
    border: 1px solid rgba(251, 192, 45, 0.4);
  `,
  danger: css`
    color: #c62828;
    background: rgba(244, 67, 54, 0.08);
    border: 1px solid rgba(244, 67, 54, 0.3);
  `,
};

const AlertContainer = styled(Flex)<{ $variant: AlertVariant }>`
  padding: 8px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  ${({ $variant }) => variantStyles[$variant]}
`;

const AlertBar: React.FC<AlertBarProps> = ({ variant = "warning", children }) => {
  return (
    <AlertContainer $variant={variant}>
      <Text as="span" $variant="body3" $weight="medium" $tone="default">
        {children}
      </Text>
    </AlertContainer>
  );
};

export default AlertBar;
