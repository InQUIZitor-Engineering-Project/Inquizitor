import React, { useState, useRef, useEffect } from "react";
import styled, { css } from "styled-components";
import { Box, Text, Stack } from "../primitives";

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  $fullWidth?: boolean;
  disabled?: boolean;
}

const SelectContainer = styled(Box)<{ $fullWidth?: boolean; $disabled?: boolean }>`
  position: relative;
  width: ${({ $fullWidth }) => ($fullWidth ? "100%" : "auto")};
  cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};
  opacity: ${({ $disabled }) => ($disabled ? 0.6 : 1)};
`;

const SelectTrigger = styled(Box)<{ $isOpen: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: #fff;
  border: 1px solid ${({ theme, $isOpen }) => ($isOpen ? theme.colors.brand.primary : theme.colors.neutral.greyBlue)};
  border-radius: ${({ theme }) => theme.radii.sm};
  transition: all 0.2s ease;
  min-height: 41.6px;
  box-sizing: border-box;

  &:hover {
    border-color: ${({ theme, $isOpen }) => (!$isOpen ? theme.colors.neutral.grey : theme.colors.brand.primary)};
  }

  ${({ $isOpen }) => $isOpen && css`
    box-shadow: 0 0 0 3px rgba(76, 175, 79, 0.1);
  `}
`;

const ArrowIcon = styled.span<{ $isOpen: boolean }>`
  border: solid ${({ theme }) => theme.colors.neutral.grey};
  border-width: 0 2px 2px 0;
  display: inline-block;
  padding: 3px;
  transform: ${({ $isOpen }) => ($isOpen ? "rotate(-135deg)" : "rotate(45deg)")};
  transition: transform 0.2s ease;
  margin-left: 8px;
`;

const DropdownMenu = styled(Box)`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid ${({ theme }) => theme.colors.neutral.greyBlue};
  border-radius: ${({ theme }) => theme.radii.sm};
  box-shadow: ${({ theme }) => theme.elevation.lg};
  z-index: 1000;
  max-height: 250px;
  overflow-y: auto;
  padding: 4px;
`;

const OptionItem = styled(Box)<{ $isSelected: boolean }>`
  display: flex;
  align-items: center;
  padding: 0 12px;
  min-height: 41.6px;
  box-sizing: border-box;
  border-radius: ${({ theme }) => theme.radii.xs};
  background: ${({ theme, $isSelected }) => ($isSelected ? theme.colors.tint.t5 : "transparent")};
  color: ${({ theme, $isSelected }) => ($isSelected ? theme.colors.brand.primary : theme.colors.neutral.black)};
  transition: background 0.15s ease;
  cursor: pointer;

  &:hover {
    background: ${({ theme, $isSelected }) => ($isSelected ? theme.colors.tint.t5 : theme.colors.neutral.silver)};
  }
`;

const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  label,
  placeholder = "Wybierz opcję...",
  $fullWidth = true,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!disabled) setIsOpen(!isOpen);
  };

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <Stack $gap="xs" style={{ width: $fullWidth ? "100%" : "auto" }}>
      {label && (
        <Text as="span" $variant="body3" $tone="muted">
          {label}
        </Text>
      )}
      <SelectContainer ref={containerRef} $fullWidth={$fullWidth} $disabled={disabled}>
        <SelectTrigger $isOpen={isOpen} onClick={handleToggle}>
          <Text 
            $tone={selectedOption ? "default" : "muted"}
            style={{ fontSize: "14px", lineHeight: "1.4" }}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </Text>
          <ArrowIcon $isOpen={isOpen} />
        </SelectTrigger>

        {isOpen && (
          <DropdownMenu>
            {options.map((option) => (
              <OptionItem
                key={option.value}
                $isSelected={option.value === value}
                onClick={() => handleSelect(option.value)}
              >
                {option.icon && <Box $mr="xs" style={{ display: 'flex', alignItems: 'center' }}>{option.icon}</Box>}
                <Text 
                  $weight={option.value === value ? ("medium" as const) : ("regular" as const)}
                  style={{ fontSize: "14px", lineHeight: "1.4" }}
                >
                  {option.label}
                </Text>
              </OptionItem>
            ))}
          </DropdownMenu>
        )}
      </SelectContainer>
    </Stack>
  );
};

export default CustomSelect;

