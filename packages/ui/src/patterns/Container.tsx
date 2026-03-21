import styled from "styled-components";
import type { DefaultTheme } from "styled-components";

type SpaceKey = keyof DefaultTheme["spacing"];
type SpaceValue = SpaceKey | string | number | undefined;

const resolveSpace = (theme: DefaultTheme, value: SpaceValue) => {
  if (value == null) return "0";
  if (typeof value === "number") return `${value}px`;
  if (typeof value === "string" && value in theme.spacing) {
    return theme.spacing[value as SpaceKey];
  }
  return value;
};

export const PageContainer = styled.div`
  width: 100%;
  margin: 0 auto;
  max-width: ${({ theme }) => theme.contentWidth.xl};
  padding-left: ${({ theme }) => theme.pagePadding.lg};
  padding-right: ${({ theme }) => theme.pagePadding.lg};

  ${({ theme }) => theme.media.down("lg")} {
    max-width: ${({ theme }) => theme.contentWidth.lg};
    padding-left: ${({ theme }) => theme.pagePadding.md};
    padding-right: ${({ theme }) => theme.pagePadding.md};
  }

  ${({ theme }) => theme.media.down("md")} {
    max-width: ${({ theme }) => theme.contentWidth.md};
    padding-left: ${({ theme }) => theme.pagePadding.md};
    padding-right: ${({ theme }) => theme.pagePadding.md};
  }

  ${({ theme }) => theme.media.down("sm")} {
    max-width: ${({ theme }) => theme.contentWidth.sm};
    padding-left: ${({ theme }) => theme.pagePadding.sm};
    padding-right: ${({ theme }) => theme.pagePadding.sm};
  }
`;

export const PageSection = styled.section<{ $bg?: string; $py?: SpaceValue }>`
  width: 100%;
  background: ${({ $bg }) => $bg ?? "transparent"};
  padding-top: ${({ theme, $py = "xl" }) => resolveSpace(theme, $py)};
  padding-bottom: ${({ theme, $py = "xl" }) => resolveSpace(theme, $py)};
`;

export default PageContainer;
