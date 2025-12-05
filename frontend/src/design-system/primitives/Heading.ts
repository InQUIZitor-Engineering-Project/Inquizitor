import styled, { css } from "styled-components";
import type { DefaultTheme } from "styled-components";

type HeadingLevel = "h1" | "h2" | "h3" | "h4";

interface HeadingProps {
  $level?: HeadingLevel;
  $tone?: "default" | "inverted";
  $align?: "left" | "center" | "right";
}

const mapLevel = (theme: DefaultTheme, level: HeadingLevel) => {
  const base = theme.typography.heading[level];
  return css`
    font-family: ${base.fontFamily};
    font-size: ${base.fontSize};
    font-weight: ${base.fontWeight};
    line-height: ${base.lineHeight};
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
