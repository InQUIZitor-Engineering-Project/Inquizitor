import styled from "styled-components";

export const PageWrapper = styled.div`
  min-height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
  background-color: ${({ theme }) => theme.colors.neutral.silver};
`;

export const ContentWrapper = styled.div`
  flex: 1;
  padding: 40px 64px 32px;
  max-width: 1280px;
  margin: 0 auto;
  box-sizing: border-box;

  @media (max-width: 900px) {
    padding: 24px 16px 16px;
  }
`;

export const Hero = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(260px, 2fr);
  gap: 40px;
  align-items: center;
  margin-bottom: 40px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 24px;
  }
`;

export const HeroText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

export const Pill = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  background: rgba(76, 175, 80, 0.08);
  color: #2e7d32;
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

export const HeroImage = styled.img`
  width: 100%;
  max-width: 360px;
  justify-self: center;
  object-fit: contain;
  filter: drop-shadow(0 10px 24px rgba(0, 0, 0, 0.12));

  @media (max-width: 900px) {
    max-width: 280px;
  }
`;

export const SearchBar = styled.div`
  margin-top: 10px;
  display: flex;
  align-items: center;
  padding: 10px 14px;
  gap: 8px;
  border-radius: 999px;
  background-color: ${({ theme }) => theme.colors.neutral.white};
  box-shadow: ${({ theme }) => theme.shadows["4px"]};
  max-width: 520px;
`;

export const SearchIcon = styled.span`
  font-size: 16px;
  opacity: 0.7;
`;

export const SearchInput = styled.input`
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  font-family: inherit;
  color: ${({ theme }) => theme.colors.neutral.dGrey};
`;

export const FAQLayout = styled.section`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  margin-bottom: 24px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

export const FAQColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const FAQCategoryTitle = styled.h2`
  ${({ theme }) => `
    font-family: ${theme.typography.body.medium.body1.fontFamily};
    font-size: ${theme.typography.body.medium.body1.fontSize};
    font-weight: ${theme.typography.body.medium.body1.fontWeight};
    line-height: ${theme.typography.body.medium.body1.lineHeight};
    color: ${theme.colors.neutral.dGrey};
  `}
  margin: 0 0 4px;
`;

export const FAQItem = styled.button<{ $active?: boolean }>`
  width: 100%;
  text-align: left;
  border: none;
  border-radius: 14px;
  padding: 12px 14px;
  background-color: ${({ $active, theme }) =>
    $active ? theme.colors.neutral.white : "rgba(255, 255, 255, 0.9)"};
  box-shadow: ${({ theme, $active }) =>
    $active ? theme.shadows["4px"] : theme.shadows["2px"]};
  cursor: pointer;
  transition: all 0.16s ease-in-out;
  display: flex;
  flex-direction: column;
  gap: 6px;

  &:hover {
    transform: translateY(-1px);
    box-shadow: ${({ theme }) => theme.shadows["4px"]};
  }
`;

export const QuestionRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  justify-content: space-between;
`;

export const QuestionText = styled.span`
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: #263238;
`;

export const Tag = styled.span`
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  background: rgba(76, 175, 80, 0.08);
  color: #2e7d32;
`;

export const Answer = styled.p`
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: #546e7a;
`;

