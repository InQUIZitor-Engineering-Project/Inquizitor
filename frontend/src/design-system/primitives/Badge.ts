import styled, { css } from "styled-components";

type BadgeVariant = "neutral" | "info" | "success" | "warning" | "danger" | "brand";

export interface BadgeProps {
  $variant?: BadgeVariant;
  $pill?: boolean;
}

const getVariantStyles = (variant: BadgeVariant, theme: any) => {
  switch (variant) {
    case "info":
      return css`
        color: ${theme.colors.brand.info};
        background: rgba(33, 148, 243, 0.12);
        border: 1px solid rgba(33, 148, 243, 0.35);
      `;
    case "success":
      return css`
        color: ${theme.colors.shade.s2};
        background: rgba(76, 175, 80, 0.12);
        border: 1px solid rgba(76, 175, 80, 0.3);
      `;
    case "warning":
      return css`
        color: ${theme.colors.action.warning};
        background: rgba(251, 192, 45, 0.16);
        border: 1px solid rgba(251, 192, 45, 0.4);
      `;
    case "danger":
      return css`
        color: ${theme.colors.danger.main};
        background: ${theme.colors.danger.bg};
        border: 1px solid ${theme.colors.danger.border};
      `;
    case "brand":
      return css`
        color: ${theme.colors.brand.primary};
        background: ${theme.colors.tint.t4};
        border: 1px solid rgba(76, 175, 80, 0.35);
      `;
    case "neutral":
    default:
      return css`
        color: ${theme.colors.neutral.dGrey};
        background: ${theme.colors.tint.t5};
        border: 1px solid ${theme.colors.neutral.greyBlue};
      `;
  }
};

export const Badge = styled.span<BadgeProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 3px 9px;
  border-radius: ${({ $pill, theme }) => ($pill === false ? theme.radii.sm : theme.radii.pill)};
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  ${({ theme, $variant = "neutral" }) => getVariantStyles($variant, theme)}
`;

Badge.defaultProps = {
  $variant: "neutral",
  $pill: true,
};

export default Badge;
