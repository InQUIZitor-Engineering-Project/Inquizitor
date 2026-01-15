import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Stack, Text, Button, Input, Flex } from "../../../design-system/primitives";

export interface CounterControlProps {
  label?: string;
  value: number;
  onChange: (next: number) => void;
  disabled?: boolean;
  helpText?: string;
  min?: number;
  max?: number;
  step?: number;
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

const CounterControl: React.FC<CounterControlProps> = ({
  label,
  value,
  onChange,
  disabled,
  helpText,
  min = 0,
  max = Number.POSITIVE_INFINITY,
  step = 1,
}) => {

  const [inputValue, setInputValue] = useState(value.toString());

  const clamp = (next: number) => Math.min(max, Math.max(min, next));

  useEffect(() => {
    if (inputValue === "") return;
    if (Number(inputValue) !== value) {
      setInputValue(value.toString());
    }
  }, [value, inputValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "") {
      setInputValue(raw);
      return;
    }

    if (raw.trim().startsWith("-")) {
      const clamped = clamp(min);
      setInputValue(clamped.toString());
      onChange(clamped);
      return;
    }

    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed)) {
      const clamped = clamp(parsed);
      setInputValue(clamped.toString());
      onChange(clamped);
      return;
    }

    setInputValue(raw);
  };

  const handleBlur = () => {
    if (inputValue === "") {
      const clampedMin = clamp(min);
      setInputValue(clampedMin.toString());
      onChange(clampedMin);
      return;
    }
    setInputValue(value.toString());
  };
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
          onClick={() => onChange(clamp(value - step))}
          disabled={disabled || value <= min}
        >
          −
        </CounterButton>
        <CounterInput
          type="number"
          value={inputValue} 
          min={min}
          max={Number.isFinite(max) ? max : undefined}
          step={step}
          onChange={handleInputChange}
          onBlur={handleBlur}
          disabled={disabled}
        />
        <CounterButton
          $variant="ghost"
          $size="sm"
          type="button"
          onClick={() => onChange(clamp(value + step))}
          disabled={disabled || value >= max}
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
