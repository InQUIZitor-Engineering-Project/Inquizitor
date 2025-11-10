import styled from "styled-components";

export const PageWrapper = styled.div`
  width: 100%;
  min-height: calc(100vh - 80px);
  background-color: ${({ theme }) => theme.colors.neutral.silver};
  display: flex;
  justify-content: center;
`;

export const ContentWrapper = styled.div`
  width: 100%;
  max-width: 1200px;
  padding: 40px 32px 24px;
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

export const HeroSection = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(260px, 1.2fr);
  align-items: center;
  gap: 32px;
  padding: 32px 28px;
  border-radius: 18px;
  background-color: ${({ theme }) => theme.colors.neutral.white};
  box-shadow: ${({ theme }) => theme.shadows["8px"]};

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    text-align: center;
  }
`;

export const HeroText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const Pill = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 14px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.brand.primary};
  background-color: rgba(76, 175, 80, 0.08);
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

export const HeroTitle = styled.h1`
  ${({ theme }) => `
    font-family: ${theme.typography.heading.h2.fontFamily};
    font-size: ${theme.typography.heading.h2.fontSize};
    font-weight: ${theme.typography.heading.h2.fontWeight};
    line-height: ${theme.typography.heading.h2.lineHeight};
    color: ${theme.colors.neutral.dGrey};
  `}
  margin: 0;
`;

export const Highlight = styled.span`
  color: ${({ theme }) => theme.colors.brand.primary};
`;

export const HeroSubtitle = styled.p`
  ${({ theme }) => `
    font-family: ${theme.typography.body.regular.body2.fontFamily};
    font-size: ${theme.typography.body.regular.body2.fontSize};
    font-weight: ${theme.typography.body.regular.body2.fontWeight};
    line-height: ${theme.typography.body.regular.body2.lineHeight};
    color: ${theme.colors.neutral.grey};
  `}
  margin: 0;
`;

export const HeroImageWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const HeroImage = styled.img`
  max-width: 100%;
  height: auto;
  display: block;
`;

export const Section = styled.section`
  padding: 24px 28px;
  border-radius: 18px;
  background-color: ${({ theme }) => theme.colors.neutral.white};
  box-shadow: ${({ theme }) => theme.shadows["4px"]};
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const SectionTitle = styled.h2`
  ${({ theme }) => `
    font-family: ${theme.typography.heading.h4.fontFamily};
    font-size: ${theme.typography.heading.h4.fontSize};
    font-weight: ${theme.typography.heading.h4.fontWeight};
    line-height: ${theme.typography.heading.h4.lineHeight};
    color: ${theme.colors.neutral.dGrey};
  `}
  margin: 0 0 4px;
`;

export const SectionText = styled.p`
  ${({ theme }) => `
    font-family: ${theme.typography.body.regular.body2.fontFamily};
    font-size: ${theme.typography.body.regular.body2.fontSize};
    line-height: ${theme.typography.body.regular.body2.lineHeight};
    color: ${theme.colors.neutral.grey};
  `}
  margin: 0;

  ul&,
  & ul {
    padding-left: 18px;
    list-style: disc;
  }
`;

export const TeamGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-top: 4px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

export const TeamCard = styled.div`
  padding: 14px 16px;
  border-radius: 14px;
  background-color: ${({ theme }) => theme.colors.neutral.silver};
  border: 1px solid rgba(76, 175, 80, 0.08);
`;

export const TeamName = styled.h3`
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 2px;
  color: ${({ theme }) => theme.colors.neutral.dGrey};
`;

export const TeamRole = styled.p`
  font-size: 12px;
  font-weight: 500;
  margin: 0 0 6px;
  color: ${({ theme }) => theme.colors.brand.primary};
`;

export const StatsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 4px;
`;

export const StatCard = styled.div`
  padding: 8px 14px;
  border-radius: 12px;
  background-color: rgba(76, 175, 80, 0.04);
  border: 1px solid rgba(76, 175, 80, 0.16);
  display: flex;
  flex-direction: column;
  min-width: 90px;
`;

export const StatNumber = styled.span`
  font-size: 16px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.brand.primary};
`;

export const StatLabel = styled.span`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.neutral.grey};
`;
