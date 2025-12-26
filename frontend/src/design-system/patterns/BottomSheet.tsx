import React, { useState, useRef, useEffect } from "react";
import styled, { keyframes, css } from "styled-components";
import { Box, Flex, Heading, Stack, CloseButton } from "../primitives";

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
`;

const Backdrop = styled.div<{ $isClosing?: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  z-index: 2000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  animation: ${fadeIn} 0.2s ease-out;
  ${({ $isClosing }) => $isClosing && css`
    opacity: 0;
    transition: opacity 0.2s ease-out;
  `}
`;

const SheetContainer = styled(Box)<{ $offset?: number, $isDragging?: boolean, $isClosing?: boolean }>`
  background: white;
  border-radius: ${({ theme }) => `${theme.radii.xl} ${theme.radii.xl} 0 0`};
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  animation: ${slideUp} 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  padding-bottom: calc(${({ theme }) => theme.spacing.xl} + env(safe-area-inset-bottom));
  touch-action: none; /* Zapobiega scrollowaniu strony podczas przeciągania */

  transform: translateY(${({ $offset = 0 }) => $offset}px);
  transition: ${({ $isDragging }) => $isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)'};

  ${({ $isClosing }) => $isClosing && css`
    transform: translateY(100%);
    transition: transform 0.2s ease-in;
  `}
`;

const Handle = styled.div`
  width: 40px;
  height: 4px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
  margin: 12px auto;
  cursor: grab;
  &:active { cursor: grabbing; }
`;

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);

  useEffect(() => {
    if (isOpen) {
      setOffset(0);
      setIsClosing(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen && !isClosing) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    currentY.current = e.touches[0].clientY;
    const delta = currentY.current - startY.current;
    if (delta > 0) {
      setOffset(delta);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (offset > 150) {
      triggerClose();
    } else {
      setOffset(0);
    }
  };

  const triggerClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

  return (
    <Backdrop onClick={triggerClose} $isClosing={isClosing}>
      <SheetContainer
        $p="lg"
        $pt="xs"
        $offset={offset}
        $isDragging={isDragging}
        $isClosing={isClosing}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Handle />
        <CloseButton onClick={triggerClose} />
        <Stack $gap="lg">
          {title && (
            <Flex $justify="space-between" $align="center">
              <Heading $level="h3" as="h3">
                {title}
              </Heading>
            </Flex>
          )}
          <Box>{children}</Box>
        </Stack>
      </SheetContainer>
    </Backdrop>
  );
};

export default BottomSheet;

