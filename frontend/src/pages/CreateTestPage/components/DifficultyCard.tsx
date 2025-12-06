import React from "react";
import { useTheme } from "styled-components";
import { Stack, Heading, Text, Box, Divider } from "../../../design-system/primitives";
import CounterControl from "./CounterControl";
import SummaryPills from "./SummaryPills";
import DistributionBar from "./DistributionBar";
import { PALETTE } from "../constants";

export interface DifficultyCardProps {
  easyCount: number;
  mediumCount: number;
  hardCount: number;
  totalAll: number;
  totalDifficulty: number;
  easyPct: number;
  medPct: number;
  hardPct: number;
  difficultyLocked: boolean;
  difficultyMismatch: boolean;
  onChangeEasy: (v: number) => void;
  onChangeMedium: (v: number) => void;
  onChangeHard: (v: number) => void;
}

const DifficultyCard: React.FC<DifficultyCardProps> = ({
  easyCount,
  mediumCount,
  hardCount,
  totalAll,
  totalDifficulty,
  easyPct,
  medPct,
  hardPct,
  difficultyLocked,
  difficultyMismatch,
  onChangeEasy,
  onChangeMedium,
  onChangeHard,
}) => {
  const theme = useTheme();

  const pills = [
    { label: "Łatwe", value: easyCount, bg: PALETTE.diff.easyBg, fg: PALETTE.diff.easyFg },
    { label: "Średnie", value: mediumCount, bg: PALETTE.diff.medBg, fg: PALETTE.diff.medFg },
    { label: "Trudne", value: hardCount, bg: PALETTE.diff.hardBg, fg: PALETTE.diff.hardFg },
    { label: "Suma", value: totalDifficulty, bg: PALETTE.total.bg, fg: PALETTE.total.fg },
  ];

  return (
    <Box $p="lg" $radius="xl" $bg="#fff" $shadow="md">
      <Stack $gap="md">
        <Stack $gap="xs">
          <Heading as="h3" $level="h4">
            Poziom trudności
          </Heading>
          <Text $variant="body3" $tone="muted">
            Rozdziel {totalAll || 0} pytań na łatwe / średnie / trudne.
          </Text>
        </Stack>

        <SummaryPills items={pills} />

        <Box
          $display="grid"
          style={{
            gridTemplateColumns: "repeat(3, minmax(140px, 1fr))",
            gap: theme.spacing.md,
          }}
        >
          <CounterControl
            label="Łatwe"
            value={easyCount}
            onChange={onChangeEasy}
            disabled={difficultyLocked}
          />
          <CounterControl
            label="Średnie"
            value={mediumCount}
            onChange={onChangeMedium}
            disabled={difficultyLocked}
          />
          <CounterControl
            label="Trudne"
            value={hardCount}
            onChange={onChangeHard}
            disabled={difficultyLocked}
          />
        </Box>

        <Divider />
        <DistributionBar easyPct={easyPct} medPct={medPct} hardPct={hardPct} disabled={difficultyLocked} />

        <Text $variant="body4" $tone="muted">
          Ł: {difficultyLocked ? 0 : easyPct}% • Ś: {difficultyLocked ? 0 : medPct}% • T:{" "}
          {difficultyLocked ? 0 : hardPct}%
        </Text>

        {!difficultyLocked && difficultyMismatch && (
          <Text $variant="body4" $tone="danger">
            Rozkład trudności (suma: {totalDifficulty}) musi równać się liczbie pytań (razem: {totalAll}).
          </Text>
        )}
        {!difficultyLocked && !difficultyMismatch && (
          <Text $variant="body4" $tone="muted">
            Upewnij się, że suma trudności pokrywa liczbę pytań.
          </Text>
        )}
        {difficultyLocked && (
          <Text $variant="body4" $tone="muted">
            Ustaw najpierw Strukturę pytań, aby odblokować rozdział trudności.
          </Text>
        )}
      </Stack>
    </Box>
  );
};

export default DifficultyCard;
