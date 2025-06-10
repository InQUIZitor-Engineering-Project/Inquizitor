import styled from "styled-components";

export const CardContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.neutral.white};
  border-radius: 8px;
  box-shadow: ${({ theme }) => theme.shadows["4px"]};
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  text-align: center;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: ${({ theme }) => theme.shadows["6px"]};
  }
`;

export const IconWrapper = styled.div`
  width: 64px;
  height: 64px;
  margin-bottom: 16px;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;

export const Title = styled.h3`
  ${({ theme }) => `
    font-family: ${theme.typography.heading.h3.fontFamily};
    font-size: ${theme.typography.heading.h3.fontSize};
    font-weight: ${theme.typography.heading.h3.fontWeight};
    line-height: ${theme.typography.heading.h3.lineHeight};
    color: ${theme.colors.neutral.dGrey};
  `}
  margin-bottom: 12px;
`;

export const Description = styled.p`
  ${({ theme }) => `
    font-family: ${theme.typography.body.regular.body3.fontFamily};
    font-size: ${theme.typography.body.regular.body3.fontSize};
    font-weight: ${theme.typography.body.regular.body3.fontWeight};
    line-height: ${theme.typography.body.regular.body3.lineHeight};
    color: ${theme.colors.neutral.lGrey};
  `}
`;

export const SectionWrapper = styled.section`
  width: 100%;
  background-color: ${({ theme }) => theme.colors.neutral.white};
  padding: 80px ${({ theme }) => theme.grid.margin};
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const SectionHeader = styled.h2`
  ${({ theme }) => `
    font-family: ${theme.typography.heading.h2.fontFamily};
    font-size: ${theme.typography.heading.h2.fontSize};
    font-weight: ${theme.typography.heading.h2.fontWeight};
    line-height: ${theme.typography.heading.h2.lineHeight};
    color: ${theme.colors.neutral.black};
  `}
  margin-bottom: 8px;
`;

export const SectionSubheader = styled.p`
  ${({ theme }) => `
    font-family: ${theme.typography.body.regular.body2.fontFamily};
    font-size: ${theme.typography.body.regular.body2.fontSize};
    font-weight: ${theme.typography.body.regular.body2.fontWeight};
    line-height: ${theme.typography.body.regular.body2.lineHeight};
    color: ${theme.colors.neutral.greyBlue};
  `}
  margin-bottom: 48px;
`;

export const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: ${({ theme }) => theme.grid.gutter};
  width: 100%;
  max-width: calc(12 * 1fr); // używamy 12 kolumn analogicznie – w praktyce to „full width” z paddingiem
`;
