import styled, { css } from "styled-components";
import type { DefaultTheme } from "styled-components";

type TextVariant = "body1" | "body2" | "body3" | "body4";
type TextWeight = "regular" | "medium";
type Tone =
  | "default"
  | "muted"
  | "subtle"
  | "inverted"
  | "info"
  | "success"
  | "warning"
  | "danger";

interface TextProps {
  $variant?: TextVariant;
  $weight?: TextWeight;
  $tone?: Tone;
  $align?: "left" | "center" | "right";
  $uppercase?: boolean;
}

const getVariant = (theme: DefaultTheme, variant: TextVariant, weight: TextWeight) => {
  const base = theme.typography.body[weight][variant];
  return css`
    font-family: ${base.fontFamily};
    font-size: ${base.fontSize};
    font-weight: ${base.fontWeight};
    line-height: ${base.lineHeight};
  `;
};

const resolveTone = (theme: DefaultTheme, tone: Tone) => {
  switch (tone) {
    case "muted":
      return theme.tone.muted;
    case "subtle":
      return theme.tone.subtle;
    case "inverted":
      return theme.tone.inverted;
    case "info":
      return theme.tone.info;
    case "success":
      return theme.tone.success;
    case "warning":
      return theme.tone.warning;
    case "danger":
      return theme.tone.danger;
    default:
      return theme.tone.default;
  }
};

export const Text = styled.p<TextProps>`
  margin: 0;
  ${({ theme, $variant = "body2", $weight = "regular" }) =>
    getVariant(theme, $variant, $weight)}
  ${({ theme, $tone = "default" }) => css`color: ${resolveTone(theme, $tone)};`}
  ${({ $align }) => $align && css`text-align: ${$align};`}
  ${({ $uppercase }) => $uppercase && css`text-transform: uppercase; letter-spacing: 0.02em;`}
`;

Text.defaultProps = {
  $variant: "body2",
  $weight: "regular",
  $tone: "default",
};

export default Text;
