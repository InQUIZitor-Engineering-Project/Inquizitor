import React from "react";
import { Card, Stack, Text, Box } from "../../design-system/primitives";

interface StepCardProps {
  iconSrc: string;
  title: string;
  description: string;
}

const StepCard: React.FC<StepCardProps> = ({ iconSrc, title, description }) => (
  <Card
    $p="lg"
    $shadow="md"
    $variant="elevated"
    style={{
      textAlign: "center",
      minWidth: 260,
      flex: "1 1 280px",
      transition: "transform 0.2s ease, box-shadow 0.2s ease",
    }}
    onMouseEnter={(e) => {
      (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
      (e.currentTarget as HTMLDivElement).style.boxShadow = "0 6px 18px rgba(0,0,0,0.12)";
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
      (e.currentTarget as HTMLDivElement).style.boxShadow = "";
    }}
  >
    <Stack $gap="md" $align="center">
      <Box
        as="img"
        src={iconSrc}
        alt={`${title} icon`}
        style={{ width: 64, height: 64, objectFit: "contain" }}
      />
      <Text as="h3" $variant="body1" $weight="medium" style={{ color: "#2d2d2d" }}>
        {title}
      </Text>
      <Text $variant="body3" $tone="muted">
        {description}
      </Text>
    </Stack>
  </Card>
);

export default StepCard;
