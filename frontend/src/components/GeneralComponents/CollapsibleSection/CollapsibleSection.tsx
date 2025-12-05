import React from "react";
import styled from "styled-components";

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
`;

const TitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Title = styled.h3`
  ${({ theme }) => `
    font-family: ${theme.typography.heading.h4.fontFamily};
    font-size: ${theme.typography.heading.h4.fontSize};
    font-weight: ${theme.typography.heading.h4.fontWeight};
    line-height: ${theme.typography.heading.h4.lineHeight};
    color: ${theme.colors.neutral.dGrey};
  `}
  margin: 0;
`;

const ActivePill = styled.span`
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  ${({ theme }) => `
    color: ${theme.colors.brand.primary};
    background: ${theme.colors.tint.t4};
  `}
`;

const Hint = styled.p`
  ${({ theme }) => `
    font-family: ${theme.typography.body.regular.body3.fontFamily};
    font-size: ${theme.typography.body.regular.body3.fontSize};
    line-height: ${theme.typography.body.regular.body3.lineHeight};
    color: ${theme.colors.neutral.grey};
  `}
  margin: 0;
`;

const Chevron = styled.div<{ $open?: boolean }>`
  display: flex;
  align-items: center;
  color: #666;
  transition: transform 0.2s ease;
  transform: ${({ $open }) => ($open ? "rotate(180deg)" : "rotate(0deg)")};
`;

const Body = styled.div`
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export interface CollapsibleSectionProps {
  title: string;
  hint?: string;
  isOpen: boolean;
  onToggle: () => void;
  isActive?: boolean;
  children?: React.ReactNode;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  hint,
  isOpen,
  onToggle,
  isActive,
  children,
}) => {
  return (
    <div>
      <Header onClick={onToggle}>
        <TitleBlock>
          <TitleRow>
            <Title>{title}</Title>
            {!isOpen && isActive && <ActivePill>Aktywna</ActivePill>}
          </TitleRow>
          {hint && <Hint>{hint}</Hint>}
        </TitleBlock>
        <Chevron $open={isOpen}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </Chevron>
      </Header>

      {isOpen && <Body>{children}</Body>}
    </div>
  );
};

export default CollapsibleSection;


