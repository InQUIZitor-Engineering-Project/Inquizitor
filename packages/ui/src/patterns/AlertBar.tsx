import React from "react";
import styled, { css } from "styled-components";
import type { DefaultTheme } from "styled-components";
import { Flex, Text } from "../primitives";

type AlertVariant = "info" | "success" | "warning" | "danger";

export interface AlertBarProps {
  variant?: AlertVariant;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const variantStyles = (theme: DefaultTheme, variant: AlertVariant) => {
  switch (variant) {
    case "info":
      return css`
        color: ${theme.colors.brand.info};
        background: ${theme.colors.neutral.silver};
        border: 1px solid ${theme.colors.neutral.greyBlue};
      `;
    case "success":
      return css`
        color: ${theme.colors.action.success};
        background: ${theme.colors.tint.t5};
        border: 1px solid ${theme.colors.neutral.greyBlue};
      `;
    case "warning":
      return css`
        color: ${theme.colors.action.warning};
        background: ${theme.colors.neutral.silver};
        border: 1px solid ${theme.colors.neutral.greyBlue};
      `;
    case "danger":
      return css`
        color: ${theme.colors.danger.main};
        background: ${theme.colors.danger.bg};
        border: 1px solid ${theme.colors.danger.border};
      `;
  }
};

const AlertContainer = styled(Flex)<{ $variant: AlertVariant }>`
  padding: 8px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  ${({ theme, $variant }) => variantStyles(theme, $variant)}
`;

const AlertBar: React.FC<AlertBarProps> = ({ variant = "warning", children, style }) => {
  return (
    <AlertContainer $variant={variant} style={style}>
      <Text as="span" $variant="body3" $weight="medium" $tone="default">
        {children}
      </Text>
    </AlertContainer>
  );
};

export default AlertBar;
