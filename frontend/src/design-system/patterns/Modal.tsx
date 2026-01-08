import React from "react";
import styled, { keyframes } from "styled-components";
import { Box, Flex, Button, Heading, Text, Stack, CloseButton } from "../primitives";

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.md};
  animation: ${fadeIn} 0.2s ease-out;
`;

const ModalContainer = styled(Box)`
  background: white;
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.elevation.xl};
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  animation: ${slideUp} 0.3s cubic-bezier(0.16, 1, 0.3, 1);
`;

export const SelectableItem = styled(Flex)<{ $active?: boolean }>`
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 2px solid ${({ theme, $active }) => ($active ? theme.colors.brand.primary : "rgba(0,0,0,0.05)")};
  background: ${({ $active }) => ($active ? "rgba(76, 175, 80, 0.05)" : "white")};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${({ theme, $active }) => ($active ? theme.colors.brand.primary : "rgba(0,0,0,0.15)")};
    background: ${({ $active }) => ($active ? "rgba(76, 175, 80, 0.08)" : "#f9f9f9")};
  }
`;

export type ModalVariant = "default" | "danger" | "info" | "success" | "brand";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: number;
  variant?: ModalVariant;
  // Props dla szybkich confirmów
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  confirmLoading?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 500,
  variant = "default",
  confirmLabel,
  cancelLabel = "Anuluj",
  onConfirm,
  confirmLoading = false,
}) => {
  if (!isOpen) return null;

  const getButtonVariant = () => {
    if (variant === "danger") return "danger";
    if (variant === "info") return "info";
    if (variant === "success") return "success";
    if (variant === "brand") return undefined; // default brand
    return undefined;
  };

  return (
    <Backdrop onClick={onClose}>
      <ModalContainer
        $p="lg"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <Stack $gap="lg">
          <Flex $justify="space-between" $align="flex-start" style={{ position: "relative" }}>
            <Heading $level="h3" as="h3">
              {title}
            </Heading>
            <CloseButton onClick={onClose} $top={0} $right={0} />
          </Flex>
          
          <Box>
            {typeof children === "string" ? (
              <Text $variant="body2" $tone="muted">
                {children}
              </Text>
            ) : (
              children
            )}
          </Box>

          {(footer || onConfirm) && (
            <Flex $justify="flex-end" $gap="sm" $wrap="wrap" $mt="md">
              {footer ? (
                footer
              ) : (
                <>
                  <Button $variant="outline" onClick={onClose} disabled={confirmLoading}>
                    {cancelLabel}
                  </Button>
                  {onConfirm && (
                    <Button
                      $variant={getButtonVariant()}
                      onClick={onConfirm}
                      disabled={confirmLoading}
                    >
                      {confirmLabel || "Potwierdź"}
                    </Button>
                  )}
                </>
              )}
            </Flex>
          )}
        </Stack>
      </ModalContainer>
    </Backdrop>
  );
};

export default Modal;

