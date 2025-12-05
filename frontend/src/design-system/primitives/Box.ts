import styled, { css } from "styled-components";
import type { DefaultTheme } from "styled-components";

type SpaceKey = keyof DefaultTheme["spacing"];
type RadiusKey = keyof DefaultTheme["radii"];
type ShadowKey = keyof DefaultTheme["elevation"] | keyof DefaultTheme["shadows"];

type SpaceValue = SpaceKey | number | string;
type RadiusValue = RadiusKey | string;
type ShadowValue = ShadowKey | string;

const resolveSpace = (theme: DefaultTheme, value?: SpaceValue) => {
  if (value == null) return undefined;
  if (typeof value === "number") return `${value}px`;
  if (typeof value === "string" && value in theme.spacing) {
    return theme.spacing[value as SpaceKey];
  }
  return value;
};

const resolveRadius = (theme: DefaultTheme, value?: RadiusValue) => {
  if (!value) return undefined;
  if (typeof value === "string" && value in theme.radii) {
    return theme.radii[value as RadiusKey];
  }
  return value;
};

const resolveShadow = (theme: DefaultTheme, value?: ShadowValue) => {
  if (!value) return undefined;
  if (typeof value === "string" && value in theme.elevation) {
    return theme.elevation[value as keyof DefaultTheme["elevation"]];
  }
  if (typeof value === "string" && value in theme.shadows) {
    return theme.shadows[value as keyof DefaultTheme["shadows"]];
  }
  return value;
};

export interface BoxProps {
  $p?: SpaceValue;
  $px?: SpaceValue;
  $py?: SpaceValue;
  $pt?: SpaceValue;
  $pr?: SpaceValue;
  $pb?: SpaceValue;
  $pl?: SpaceValue;
  $m?: SpaceValue;
  $mx?: SpaceValue;
  $my?: SpaceValue;
  $mt?: SpaceValue;
  $mr?: SpaceValue;
  $mb?: SpaceValue;
  $ml?: SpaceValue;
  $gap?: SpaceValue;
  $bg?: string;
  $radius?: RadiusValue;
  $shadow?: ShadowValue;
  $border?: string;
  $width?: string;
  $height?: string;
  $flex?: string | number;
  $display?: string;
  $overflow?: string;
  $overflowX?: string;
  $overflowY?: string;
}

export const Box = styled.div<BoxProps>`
  ${({ $display }) => $display && css`display: ${$display};`}
  ${({ $flex }) =>
    $flex !== undefined &&
    css`
      flex: ${$flex};
    `}
  ${({ $width }) => $width && css`width: ${$width};`}
  ${({ $height }) => $height && css`height: ${$height};`}

  ${({ theme, $p }) => $p && css`padding: ${resolveSpace(theme, $p)};`}
  ${({ theme, $px }) =>
    $px &&
    css`
      padding-left: ${resolveSpace(theme, $px)};
      padding-right: ${resolveSpace(theme, $px)};
    `}
  ${({ theme, $py }) =>
    $py &&
    css`
      padding-top: ${resolveSpace(theme, $py)};
      padding-bottom: ${resolveSpace(theme, $py)};
    `}
  ${({ theme, $pt }) => $pt && css`padding-top: ${resolveSpace(theme, $pt)};`}
  ${({ theme, $pr }) => $pr && css`padding-right: ${resolveSpace(theme, $pr)};`}
  ${({ theme, $pb }) => $pb && css`padding-bottom: ${resolveSpace(theme, $pb)};`}
  ${({ theme, $pl }) => $pl && css`padding-left: ${resolveSpace(theme, $pl)};`}

  ${({ theme, $m }) => $m && css`margin: ${resolveSpace(theme, $m)};`}
  ${({ theme, $mx }) =>
    $mx &&
    css`
      margin-left: ${resolveSpace(theme, $mx)};
      margin-right: ${resolveSpace(theme, $mx)};
    `}
  ${({ theme, $my }) =>
    $my &&
    css`
      margin-top: ${resolveSpace(theme, $my)};
      margin-bottom: ${resolveSpace(theme, $my)};
    `}
  ${({ theme, $mt }) => $mt && css`margin-top: ${resolveSpace(theme, $mt)};`}
  ${({ theme, $mr }) => $mr && css`margin-right: ${resolveSpace(theme, $mr)};`}
  ${({ theme, $mb }) => $mb && css`margin-bottom: ${resolveSpace(theme, $mb)};`}
  ${({ theme, $ml }) => $ml && css`margin-left: ${resolveSpace(theme, $ml)};`}

  ${({ theme, $gap }) => $gap && css`gap: ${resolveSpace(theme, $gap)};`}
  ${({ $bg }) => $bg && css`background: ${$bg};`}
  ${({ theme, $radius }) =>
    $radius &&
    css`
      border-radius: ${resolveRadius(theme, $radius)};
    `}
  ${({ theme, $shadow }) =>
    $shadow &&
    css`
      box-shadow: ${resolveShadow(theme, $shadow)};
    `}
  ${({ $border }) => $border && css`border: ${$border};`}
  ${({ $overflow }) => $overflow && css`overflow: ${$overflow};`}
  ${({ $overflowX }) => $overflowX && css`overflow-x: ${$overflowX};`}
  ${({ $overflowY }) => $overflowY && css`overflow-y: ${$overflowY};`}
`;

export default Box;
