import React from "react";
import styled, { useTheme } from "styled-components";
import { Stack, Heading, Text, Box } from "../../../design-system/primitives";
import CounterControl from "./CounterControl";
import SummaryPills from "./SummaryPills";
import { PALETTE } from "../constants";

export interface StructureCardProps {
  tfCount: number;
  singleCount: number;
  multiCount: number;
  openCount: number;
  totalClosed: number;
  totalAll: number;
  onChangeTf: (v: number) => void;
  onChangeSingle: (v: number) => void;
  onChangeMulti: (v: number) => void;
  onChangeOpen: (v: number) => void;
}

const StructureCard: React.FC<StructureCardProps> = ({
  tfCount,
  singleCount,
  multiCount,
  openCount,
  totalClosed,
  totalAll,
  onChangeTf,
  onChangeSingle,
  onChangeMulti,
  onChangeOpen,
}) => {
  const theme = useTheme();

  const pills = [
    { label: "Zamknięte", value: totalClosed, bg: PALETTE.type.closedBg, fg: PALETTE.type.closedFg },
    { label: "Otwarte", value: openCount, bg: PALETTE.type.openBg, fg: PALETTE.type.openFg },
    { label: "Razem", value: totalAll, bg: PALETTE.total.bg, fg: PALETTE.total.fg },
  ];

  const CountersGrid = styled(Box)`
    display: grid;
    grid-template-columns: repeat(4, minmax(140px, 1fr));
    gap: ${theme.spacing.md};

    ${({ theme }) => theme.media.down("md")} {
      grid-template-columns: repeat(2, minmax(160px, 1fr));
    }

    ${({ theme }) => theme.media.down("sm")} {
      grid-template-columns: 1fr;
      justify-items: center;

      > * {
        width: 100%;
      }
    }
  `;

  return (
    <Box $p="lg" $radius="xl" $bg="#fff" $shadow="md">
      <Stack $gap="md">
        <Stack $gap="xs">
          <Heading as="h3" $level="h4">
            Struktura pytań
          </Heading>
          <Text $variant="body3" $tone="muted">
            Najpierw ustaw liczbę pytań każdego rodzaju.
          </Text>
        </Stack>

        <SummaryPills items={pills} />

        <CountersGrid>
          <CounterControl
            label="Prawda / Fałsz"
            value={tfCount}
            onChange={(v) => onChangeTf(Math.max(0, v))}
            helpText="Typ zamknięty"
          />
          <CounterControl
            label="Jednokrotnego wyboru"
            value={singleCount}
            onChange={(v) => onChangeSingle(Math.max(0, v))}
            helpText="Typ zamknięty"
          />
          <CounterControl
            label="Wielokrotnego wyboru"
            value={multiCount}
            onChange={(v) => onChangeMulti(Math.max(0, v))}
            helpText="Typ zamknięty"
          />
          <CounterControl
            label="Otwarte"
            value={openCount}
            onChange={(v) => onChangeOpen(Math.max(0, v))}
            helpText="Wpisywana odpowiedź"
          />
        </CountersGrid>

        <Text $variant="body4" $tone="muted">
          Podgląd: {tfCount} P/F • {singleCount} jednokrotnego • {multiCount} wielokrotnego • {openCount} otwartych
        </Text>
      </Stack>
    </Box>
  );
};

export default StructureCard;
