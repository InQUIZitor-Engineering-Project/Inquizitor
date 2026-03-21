import React from "react";
import { Stack, Text } from "../primitives";

export interface FormFieldProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  spacing?: "xs" | "sm" | "md";
  fullWidth?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  hint,
  error,
  required,
  children,
  spacing = "sm",
  fullWidth,
}) => {
  return (
    <Stack $gap={spacing} style={fullWidth ? { width: "100%" } : undefined}>
      {label && (
        <Text $variant="body3" $weight="medium" $tone="default">
          {label}
          {required && (
            <Text as="span" $variant="body3" $weight="medium" $tone="danger">
              {" "}
              *
            </Text>
          )}
        </Text>
      )}

      {children}

      {hint && !error && (
        <Text $variant="body4" $tone="muted">
          {hint}
        </Text>
      )}
      {error && (
        <Text $variant="body4" $tone="danger">
          {error}
        </Text>
      )}
    </Stack>
  );
};

export default FormField;
