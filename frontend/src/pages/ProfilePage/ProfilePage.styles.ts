import styled from "styled-components";

export const PageWrapper = styled.div`
  min-height: calc(100vh - 40px);
  background-color: ${({ theme }) => theme.colors.neutral.silver};
  display: flex;
  flex-direction: column;
`;

export const ContentWrapper = styled.div`
  padding: 40px;
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
`;

export const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 32px;
  margin-bottom: 32px;

  @media (max-width: 900px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

export const UserInfoBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const Greeting = styled.h1`
  ${({ theme }) => `
    font-family: ${theme.typography.heading.h2.fontFamily};
    font-size: ${theme.typography.heading.h2.fontSize};
    font-weight: ${theme.typography.heading.h2.fontWeight};
    line-height: ${theme.typography.heading.h2.lineHeight};
    color: ${theme.colors.neutral.dGrey};
  `}
  margin: 0;
`;

export const Subtext = styled.p`
  ${({ theme }) => `
    font-family: ${theme.typography.body.regular.body2.fontFamily};
    font-size: ${theme.typography.body.regular.body2.fontSize};
    line-height: ${theme.typography.body.regular.body2.lineHeight};
    color: ${theme.colors.neutral.grey};
  `}
  margin: 0;
`;

export const UserMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 6px;
`;

export const MetaPill = styled.div`
  padding: 6px 10px;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.tint.t5};
  color: ${({ theme }) => theme.colors.neutral.dGrey};
  font-size: 11px;
`;

export const IllustrationWrapper = styled.div`
  flex-shrink: 0;
`;

export const ProfileIllustration = styled.img`
  width: 180px;
  max-width: 100%;
  object-fit: contain;
  display: block;
`;

export const MainGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(280px, 1.4fr);
  gap: 24px;
  align-items: flex-start;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

/* Karty */

export const Card = styled.div`
  background-color: ${({ theme }) => theme.colors.neutral.white};
  border-radius: 14px;
  box-shadow: ${({ theme }) => theme.shadows["4px"]};
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const CardHeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: baseline;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.neutral.dGrey};
  }
`;

export const CardHint = styled.p`
  margin: 0;
  font-size: 11px;
  color: ${({ theme }) => theme.colors.neutral.grey};
`;

export const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 12px;
  margin-top: 4px;
`;

export const StatBox = styled.div`
  padding: 10px 10px 9px;
  border-radius: 10px;
  background: ${({ theme }) => theme.colors.tint.t5};
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const StatLabel = styled.div`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.neutral.grey};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

export const StatValue = styled.div`
  font-size: 17px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.brand.primary};
`;

export const SecondaryValue = styled.div`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.neutral.dGrey};
`;

export const Divider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colors.neutral.silver};
  margin: 4px 0 2px;
`;

/* "Diagram" paskowy */

export const BarSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 4px;
`;

export const BarRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 10px;
  color: ${({ theme }) => theme.colors.neutral.grey};
`;

export const BarLabel = styled.span`
  min-width: 80px;
`;

export const BarTrack = styled.div`
  flex: 1;
  height: 7px;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.neutral.silver};
  overflow: hidden;
`;

export const BarFill = styled.div<{ $color: string; $width: number }>`
  height: 100%;
  width: ${({ $width }) => Math.max(0, Math.min(100, $width))}%;
  background: ${({ $color }) => $color};
  border-radius: 999px;
  transition: width 0.25s ease-out;
`;

/* Formularz hasła */

export const PasswordCard = styled(Card)`
  /* Zostaje kartą w prawej kolumnie */
`;

export const FormField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 10px;

  label {
    font-size: 11px;
    color: ${({ theme }) => theme.colors.neutral.grey};
  }

  input {
    padding: 8px 10px;
    border-radius: 8px;
    border: 1px solid ${({ theme }) => theme.colors.neutral.greyBlue};
    font-size: 13px;
    font-family: inherit;
  }
`;

export const SaveButton = styled.button`
  margin-top: 4px;
  padding: 9px 16px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  background: ${({ theme }) => theme.colors.brand.primary};
  color: ${({ theme }) => theme.colors.neutral.white};
  font-size: 13px;
  font-weight: 500;
  align-self: flex-start;
  box-shadow: ${({ theme }) => theme.shadows["2px"]};
  transition: all 0.15s ease-in-out;

  &:hover {
    transform: translateY(-1px);
    box-shadow: ${({ theme }) => theme.shadows["4px"]};
  }
`;

export const ErrorText = styled.p`
  margin-top: 4px;
  font-size: 11px;
  color: ${({ theme }) => theme.colors.action.error};
`;

export const SuccessText = styled.p`
  margin-top: 4px;
  font-size: 11px;
  color: #2e7d32;
`;

