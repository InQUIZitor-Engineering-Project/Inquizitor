import React from "react";
import styled from "styled-components";
import { Card, Flex, Stack, Heading, Divider, ActionBar } from "../primitives";

export interface QuestionCardProps {
  index?: number;
  title: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

const HeaderRow = styled(Flex)`
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: flex-start;
  justify-content: space-between;
`;

const TitleRow = styled(Flex)`
  gap: ${({ theme }) => theme.spacing.xs};
  align-items: center;
`;

const IndexChip = styled.span`
  min-width: 26px;
  height: 26px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 12px;
  color: #374151;
  background: #eef2ff;
  border: 1px solid #dbeafe;
`;

const QuestionCard: React.FC<QuestionCardProps> = ({ index, title, meta, actions, children }) => {
  return (
    <Card $p="lg" $shadow="md" $variant="elevated">
      <Stack $gap="md">
        <HeaderRow>
          <TitleRow>
            {typeof index === "number" && <IndexChip>{index + 1}</IndexChip>}
            <Heading as="h3" $level="h3">
              {title}
            </Heading>
          </TitleRow>
          {meta}
        </HeaderRow>

        {children && (
          <>
            <Divider />
            <Stack $gap="sm">{children}</Stack>
          </>
        )}

        {actions && (
          <>
            <Divider />
            <ActionBar>{actions}</ActionBar>
          </>
        )}
      </Stack>
    </Card>
  );
};

export default QuestionCard;
