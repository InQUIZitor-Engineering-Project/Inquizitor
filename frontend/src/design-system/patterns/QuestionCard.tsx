import React from "react";
import styled from "styled-components";
import { Card, Flex, Stack, Heading, Divider, ActionBar } from "../primitives";

const GUTTER_WIDTH = 40;

export interface QuestionCardProps {
  /** Optional left column (drag handle + checkbox). When set, card uses two-column layout. */
  leftGutter?: React.ReactNode;
  index?: number | React.ReactNode;
  title: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

const CardInner = styled(Flex)`
  width: 100%;
  align-items: stretch;
`;

const GutterColumn = styled.div`
  width: ${GUTTER_WIDTH}px;
  min-width: ${GUTTER_WIDTH}px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding-top: 2px;
`;

const ContentColumn = styled(Stack)`
  flex: 1;
  min-width: 0;
`;

const HeaderRow = styled(Flex)`
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: flex-start;
  justify-content: space-between;
`;

const TitleRow = styled(Flex)`
  gap: ${({ theme }) => theme.spacing.xs};
  align-items: center;
  min-width: 0;
`;

export const IndexChip = styled.span`
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
  flex-shrink: 0;
`;

const QuestionCard: React.FC<QuestionCardProps> = ({
  leftGutter,
  index,
  title,
  meta,
  actions,
  children,
  style,
  className,
}) => {
  const content = (
    <ContentColumn $gap="md">
      <HeaderRow>
        <TitleRow>
          {typeof index === "number" ? <IndexChip>{index + 1}</IndexChip> : index}
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
    </ContentColumn>
  );

  return (
    <Card
      $p={leftGutter != null ? "sm" : "lg"}
      $pr={leftGutter != null ? "md" : undefined}
      $py={leftGutter != null ? "md" : undefined}
      $shadow="md"
      $variant="elevated"
      style={style}
      className={className}
    >
      {leftGutter != null ? (
        <CardInner $gap="sm">
          <GutterColumn>{leftGutter}</GutterColumn>
          {content}
        </CardInner>
      ) : (
        content
      )}
    </Card>
  );
};

export default QuestionCard;
