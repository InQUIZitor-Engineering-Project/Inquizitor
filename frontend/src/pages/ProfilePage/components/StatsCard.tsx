import React from "react";
import { Card, Stack, Heading, Text, Flex, Box, Divider } from "../../../design-system/primitives";
import InfoTile from "./InfoTile";

interface StatsCardProps {
  stats: {
    total_tests?: number;
    total_questions?: number;
    total_files?: number;
    avg_questions_per_test?: number;
    last_test_created_at?: string | null;
    total_closed_questions?: number;
    total_open_questions?: number;
    total_easy_questions?: number;
    total_medium_questions?: number;
    total_hard_questions?: number;
  } | null;
}

const BarRow = ({ label, color, pct, value }: { label: string; color: string; pct: number; value: number }) => (
  <Stack $gap="4px">
    <Flex $align="center" $gap="sm" $justify="space-between">
      <Text $variant="body3" $tone="muted">
        {label}
      </Text>
      <Text $variant="body3" $tone="muted">
        {value} ({pct}%)
      </Text>
    </Flex>
    <Box $bg="#eef0f3" $radius="pill" style={{ width: "100%", height: 8, overflow: "hidden" }}>
      <Box $bg={color} style={{ width: `${pct}%`, height: "100%", transition: "width 0.2s ease" }} />
    </Box>
  </Stack>
);

const StatsCard: React.FC<StatsCardProps> = ({ stats }) => {
  const totalQuestions = stats?.total_questions ?? 0;
  const avgQuestions = stats?.avg_questions_per_test ?? 0;

  const pct = (value: number | undefined) => {
    if (!stats || !totalQuestions || !value) return 0;
    return Math.round((value / totalQuestions) * 100);
  };

  const hasBreakdown =
    !!stats &&
    (stats.total_closed_questions !== undefined ||
      stats.total_open_questions !== undefined ||
      stats.total_easy_questions !== undefined ||
      stats.total_medium_questions !== undefined ||
      stats.total_hard_questions !== undefined);

  return (
    <Card $p="lg" $shadow="md" $variant="elevated">
      <Stack $gap="md">
        <Heading $level="h3">Twoje statystyki</Heading>
        <Text $variant="body3" $tone="muted">
          Podsumowanie aktywności na podstawie wygenerowanych testów.
        </Text>

        <Flex $gap="lg" $wrap="wrap">
          <InfoTile label="Testy" value={stats?.total_tests ?? 0} helper="łącznie wygenerowanych" />
          <InfoTile label="Pytania" value={totalQuestions} helper="we wszystkich testach" />
          <InfoTile label="Śr. pytań / test" value={avgQuestions.toFixed(1)} helper="efektywność generowania" />
          <InfoTile label="Materiały" value={stats?.total_files ?? 0} helper="wgrane pliki źródłowe" />
        </Flex>

        <Divider />

        {hasBreakdown && totalQuestions > 0 ? (
          <Stack $gap="md">
            <Text $variant="body2" $weight="medium" $tone="default">
              Struktura Twoich pytań
            </Text>
            {stats?.total_closed_questions !== undefined && (
              <BarRow label="Zamknięte" color="rgba(33, 150, 243, 0.65)" pct={pct(stats.total_closed_questions)} value={stats.total_closed_questions} />
            )}
            {stats?.total_open_questions !== undefined && (
              <BarRow label="Otwarte" color="rgba(156, 39, 176, 0.65)" pct={pct(stats.total_open_questions)} value={stats.total_open_questions} />
            )}
            {stats?.total_easy_questions !== undefined && (
              <BarRow label="Łatwe" color="rgba(76, 175, 80, 0.8)" pct={pct(stats.total_easy_questions)} value={stats.total_easy_questions} />
            )}
            {stats?.total_medium_questions !== undefined && (
              <BarRow label="Średnie" color="rgba(255, 193, 7, 0.9)" pct={pct(stats.total_medium_questions)} value={stats.total_medium_questions} />
            )}
            {stats?.total_hard_questions !== undefined && (
              <BarRow label="Trudne" color="rgba(244, 67, 54, 0.9)" pct={pct(stats.total_hard_questions)} value={stats.total_hard_questions} />
            )}
          </Stack>
        ) : (
          <Text $variant="body3" $tone="muted">
            Szczegółowa struktura pytań będzie dostępna po dodaniu dodatkowych statystyk w systemie.
          </Text>
        )}

        {stats?.last_test_created_at && (
          <Text $variant="body3" $tone="muted">
            Ostatni test wygenerowano: {new Date(stats.last_test_created_at).toLocaleString("pl-PL")}
          </Text>
        )}
      </Stack>
    </Card>
  );
};

export default StatsCard;
