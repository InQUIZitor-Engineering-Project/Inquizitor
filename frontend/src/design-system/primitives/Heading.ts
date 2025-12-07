import styled, { css } from "styled-components";
import type { DefaultTheme } from "styled-components";

type HeadingLevel = "h1" | "h2" | "h3" | "h4";

interface HeadingProps {
  $level?: HeadingLevel;
  $tone?: "default" | "inverted";
  $align?: "left" | "center" | "right";
}

const clampMap: Record<
  HeadingLevel,
  { fontSize: string; lineHeight: string }
> = {
  h1: { fontSize: "clamp(32px, 6vw, 64px)", lineHeight: "clamp(40px, 7vw, 76px)" },
  h2: { fontSize: "clamp(28px, 4.5vw, 36px)", lineHeight: "clamp(34px, 5.5vw, 44px)" },
  h3: { fontSize: "clamp(22px, 3.5vw, 28px)", lineHeight: "clamp(30px, 4.5vw, 36px)" },
  h4: { fontSize: "clamp(18px, 3vw, 20px)", lineHeight: "clamp(24px, 3.5vw, 28px)" },
};

const mapLevel = (theme: DefaultTheme, level: HeadingLevel) => {
  const base = theme.typography.heading[level];
  return css`
    font-family: ${base.fontFamily};
    font-size: ${clampMap[level].fontSize};
    font-weight: ${base.fontWeight};
    line-height: ${clampMap[level].lineHeight};
  `;
};

export const Heading = styled.h2<HeadingProps>`
  margin: 0;
  ${({ theme, $level = "h2" }) => mapLevel(theme, $level)}
  ${({ theme, $tone = "default" }) =>
    css`
      color: ${$tone === "inverted" ? theme.tone.inverted : theme.colors.neutral.dGrey};
    `}
  ${({ $align }) => $align && css`text-align: ${$align};`}
`;

Heading.defaultProps = {
  $level: "h2",
  $tone: "default",
};

export default Heading;
