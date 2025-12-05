import React from "react";
import styled from "styled-components";

const NativeInput = styled.input.attrs({ type: "checkbox" })`
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1px solid ${({ theme }) => theme.colors.neutral.greyBlue};
  background: #ffffff;
  cursor: pointer;
  appearance: none;
  display: inline-block;
  position: relative;
  margin: 0;

  &:checked {
    background: ${({ theme }) => theme.colors.brand.primary};
    border-color: ${({ theme }) => theme.colors.brand.primary};
  }

  &:checked::after {
    content: "✓";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -52%);
    font-size: 11px;
    color: #ffffff; /* biały tick */
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const Label = styled.label`
  display: inline-flex;
  align-items: flex-start;
  gap: 8px;
  cursor: pointer;

  span {
    ${({ theme }) => `
      font-family: ${theme.typography.body.regular.body3.fontFamily};
      font-size: ${theme.typography.body.regular.body3.fontSize};
      font-weight: ${theme.typography.body.regular.body3.fontWeight};
      line-height: ${theme.typography.body.regular.body3.lineHeight};
      color: ${theme.colors.neutral.dGrey};
    `}
  }
`;

interface CheckboxProps {
  id?: string;
  name?: string;
  label?: React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  id,
  name,
  label,
  checked,
  onChange,
  disabled,
  className,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    onChange(e.target.checked);
  };

  return (
    <Label className={className} htmlFor={id}>
      <NativeInput
        id={id}
        name={name}
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
      />
      {label != null && <span>{label}</span>}
    </Label>
  );
};

export default Checkbox;

