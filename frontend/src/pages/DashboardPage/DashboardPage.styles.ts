import styled from "styled-components";

export const DashboardWrapper = styled.div`
  display: grid;
  grid-template-columns: 280px 1fr;
  height: calc(100vh - 80px);
  background-color: ${({ theme }) => theme.colors.neutral.silver};
`;

// This style is kept for the new hub content
export const Subheading = styled.p`
  ${({ theme }) => `
    text-align: center;
    font-family: ${theme.typography.body.regular.body2.fontFamily};
    font-size: ${theme.typography.body.regular.body2.fontSize};
    font-weight: ${theme.typography.body.regular.body2.fontWeight};
    line-height: ${theme.typography.body.regular.body2.lineHeight};
    color: ${theme.colors.neutral.grey};
  `}
  margin: 16px 0 8px;
`;

export const EmptyStateWrapper = styled.div<{ $isHub?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 24px;
  background-color: ${({ theme }) => theme.colors.neutral.silver};
    height: calc(100vh - 80px);

  ${({ $isHub }) =>
    $isHub &&
    `
    height: auto; 
    padding: 40px; 
  `}
`;

export const EmptyStateImage = styled.img`
  width: 200px;
`;

export const EmptyStateHeading = styled.h2`
  ${({ theme }) => `
    font-family: ${theme.typography.heading.h3.fontFamily};
    font-size: ${theme.typography.heading.h3.fontSize};
    font-weight: ${theme.typography.heading.h3.fontWeight};
  `}
`;

export const EmptyStateButton = styled.button`
  ${({ theme }) => `
    font-family: ${theme.typography.body.medium.body2.fontFamily};
    font-size: ${theme.typography.body.medium.body2.fontSize};
    font-weight: ${theme.typography.body.medium.body2.fontWeight};
  `}
  background-color: ${({ theme }) => theme.colors.brand.primary};
  color: ${({ theme }) => theme.colors.neutral.white};
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
`;
