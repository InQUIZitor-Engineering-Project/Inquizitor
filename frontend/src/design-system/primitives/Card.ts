import styled, { css } from "styled-components";
import { Box } from "./Box";
import type { BoxProps } from "./Box";

type CardVariant = "elevated" | "outline" | "flat";

export interface CardProps extends BoxProps {
  $variant?: CardVariant;
}

export const Card = styled(Box).attrs<CardProps>(({ theme, $variant }) => {
  const radius = theme.radii.xl;
  const padding = theme.spacing.lg;
  const shadow = $variant === "elevated" ? "md" : undefined;
  const border =
    $variant === "outline" ? `1px solid ${theme.colors.neutral.greyBlue}` : undefined;
  const background = "#ffffff";

  return {
    $radius: radius,
    $p: padding,
    $shadow: shadow,
    $border: border,
    $bg: background,
  };
})<CardProps>`
  ${({ $variant }) =>
    $variant === "flat" &&
    css`
      box-shadow: none;
      border: none;
    `}
`;

Card.defaultProps = {
  $variant: "elevated",
};

export default Card;
