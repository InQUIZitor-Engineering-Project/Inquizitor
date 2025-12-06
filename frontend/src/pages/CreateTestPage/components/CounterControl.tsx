import React from "react";
import styled from "styled-components";
import { Stack, Text, Button, Input, Flex } from "../../../design-system/primitives";

export interface CounterControlProps {
  label?: string;
  value: number;
  onChange: (next: number) => void;
  disabled?: boolean;
  helpText?: string;
}

const CounterShell = styled.div`
  display: inline-flex;
  align-items: center;
  width: 100%;
  border: 1px solid ${({ theme }) => theme.colors.neutral.greyBlue};
  border-radius: ${({ theme }) => theme.radii.md};
  overflow: hidden;
  background: ${({ theme }) => theme.colors.neutral.white};
`;

const CounterButton = styled(Button)`
  border-radius: 0;
  min-width: 40px;
  height: 100%;
  background: rgba(76, 175, 80, 0.12);
  color: ${({ theme }) => theme.colors.shade.s2};
  box-shadow: none;
  border: none;

  &:hover:enabled {
    background: rgba(76, 175, 80, 0.18);
  }
`;

const CounterInput = styled(Input)`
  flex: 1;
  min-width: 0;
  border: none;
  text-align: center;
  padding: 8px 10px;
  box-shadow: none;

  &:focus {
    outline: none;
    box-shadow: none;
  }

  /* hide spinners */
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  &[type="number"] {
    -moz-appearance: textfield;
  }
`;

const CounterControl: React.FC<CounterControlProps> = ({ label, value, onChange, disabled, helpText }) => {
  return (
    <Stack $gap="xs">
      {label && (
        <Text $variant="body3" $weight="medium">
          {label}
        </Text>
      )}
      <CounterShell>
        <CounterButton
          $variant="ghost"
          $size="sm"
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={disabled}
        >
          −
        </CounterButton>
        <CounterInput
          type="number"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        />
        <CounterButton
          $variant="ghost"
          $size="sm"
          type="button"
          onClick={() => onChange(value + 1)}
          disabled={disabled}
        >
          +
        </CounterButton>
      </CounterShell>
      {helpText && (
        <Flex $align="center">
          <Text $variant="body4" $tone="muted">
            {helpText}
          </Text>
        </Flex>
      )}
    </Stack>
  );
};

export default CounterControl;
