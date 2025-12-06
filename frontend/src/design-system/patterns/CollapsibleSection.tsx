import React from "react";
import styled from "styled-components";
import { Card, Flex, Stack, Text, Heading } from "../primitives";

export interface CollapsibleSectionProps {
  title: string;
  hint?: string;
  isOpen: boolean;
  onToggle: () => void;
  isActive?: boolean;
  children?: React.ReactNode;
  withCard?: boolean;
}

const HeaderButton = styled.button`
  width: 100%;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  text-align: left;
`;

const Chevron = styled.div<{ $open?: boolean }>`
  display: flex;
  align-items: center;
  color: #666;
  transition: transform 0.2s ease;
  transform: ${({ $open }) => ($open ? "rotate(180deg)" : "rotate(0deg)")};
`;

const Pill = styled.span`
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: 12px;
  font-weight: 500;
  ${({ theme }) => `
    color: ${theme.colors.brand.primary};
    background: ${theme.colors.tint.t4};
  `}
`;

const Body = styled.div`
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  hint,
  isOpen,
  onToggle,
  isActive,
  children,
  withCard = false,
}) => {
  const content = (
    <Stack $gap="sm">
      <HeaderButton onClick={onToggle} aria-expanded={isOpen}>
        <Flex $align="center" $justify="space-between" $gap="sm">
          <Stack $gap="xs">
            <Flex $align="center" $gap="xs">
              <Heading as="h3" $level="h4">
                {title}
              </Heading>
              {!isOpen && isActive && <Pill>Aktywna</Pill>}
            </Flex>
            {hint && (
              <Text $variant="body3" $tone="muted">
                {hint}
              </Text>
            )}
          </Stack>
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
        </Flex>
      </HeaderButton>
      {isOpen && <Body>{children}</Body>}
    </Stack>
  );

  if (withCard) {
    return (
      <Card $p="lg" $shadow="md" $variant="elevated">
        {content}
      </Card>
    );
  }

  return <div>{content}</div>;
};

export default CollapsibleSection;
