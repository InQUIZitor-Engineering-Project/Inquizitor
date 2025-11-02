import styled from "styled-components";

export const HeroSection = styled.section`
  width: 100%;
  background-color: ${({ theme }) => theme.colors.neutral.silver};
  padding: 80px ${({ theme }) => theme.grid.margin};
`;

export const ContentWrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  align-items: center;
  gap: ${({ theme }) => theme.grid.gutter};
  max-width: calc(12 * 1fr); /* keep proportions consistent with our column layout */
  margin: 0 auto;
`;

export const TextContent = styled.div`
  grid-column: span 6;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

export const Title = styled.h1`
  ${({ theme }) => `
    font-family: ${theme.typography.heading.h1.fontFamily};
    font-size: ${theme.typography.heading.h1.fontSize};
    font-weight: ${theme.typography.heading.h1.fontWeight};
    line-height: ${theme.typography.heading.h1.lineHeight};
    color: ${theme.colors.neutral.dGrey};
  `}
`;

export const Subtitle = styled.p`
  ${({ theme }) => `
    font-family: ${theme.typography.body.regular.body2.fontFamily};
    font-size: ${theme.typography.body.regular.body2.fontSize};
    font-weight: ${theme.typography.body.regular.body2.fontWeight};
    line-height: ${theme.typography.body.regular.body2.lineHeight};
    color: ${theme.colors.neutral.grey};
  `}
  max-width: 480px;
`;

export const PrimaryButtonWrapper = styled.div`
  margin-top: 16px;
`;

export const ImageWrapper = styled.div`
  grid-column: span 6;
  display: flex;
  justify-content: center;
`;

export const Illustration = styled.img`
  width: 100%;
  max-width: 500px;
  object-fit: contain;
`;
