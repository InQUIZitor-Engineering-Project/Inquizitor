import React from "react";
import { StyledButton } from "./Button.styles";
import type { ButtonProps } from "./Button.styles";

export type { ButtonProps };

const Button: React.FC<ButtonProps> = ({ children, variant = "primary", ...rest }) => {
  return (
    <StyledButton variant={variant} {...rest}>
      {children}
    </StyledButton>
  );
};

export default Button;
