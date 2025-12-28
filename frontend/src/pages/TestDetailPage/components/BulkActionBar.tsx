import React from "react";
import styled from "styled-components";
import { Box, Flex, Button, Text, Stack, CloseButton } from "../../../design-system/primitives";
import { BottomSheet, SelectableItem } from "../../../design-system/patterns";

const FloatingContainer = styled(Box)`
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  width: 93%;
  max-width: 1000px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(0, 0, 0, 0.08);
  padding: 12px 16px;
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  @media (min-width: 600px) {
    width: 60%;
    padding: 16px 24px;
  }

  @keyframes slideUp {
    from {
      transform: translate(-50%, 120%);
      opacity: 0;
    }
    to {
      transform: translate(-50%, 0);
      opacity: 1;
    }
  }
`;

const CountCircle = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.brand.primary};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
`;

const DesktopActions = styled(Flex)`
  display: none;
  @media (min-width: 600px) {
    display: flex;
  }
`;

const MobileActions = styled(Flex)`
  display: flex;
  @media (min-width: 600px) {
    display: none;
  }
`;

const HeaderWrapper = styled(Flex)`
  width: 100%;
  position: relative;
  justify-content: space-between;
  align-items: center;

  @media (min-width: 600px) {
    justify-content: center;
  }
`;

const HideOnMobile = styled.span`
  display: none;
  @media (min-width: 370px) {
    display: inline;
  }
`;

const getPlural = (count: number) => {
  if (count === 1) return "pytanie";
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 10 || lastTwoDigits >= 20)) {
    return "pytania";
  }
  return "pytań";
};

export interface BulkActionBarProps {
  selectedCount: number;
  onDelete: () => void;
  onOpenDifficulty: () => void;
  onOpenTypeChange: () => void;
  onRegenerate: () => void;
  onClear: () => void;
  isMenuOpen: boolean;
  onOpenMenu: () => void;
  onCloseMenu: () => void;
}

const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  onDelete,
  onOpenDifficulty,
  onOpenTypeChange,
  onRegenerate,
  onClear,
  isMenuOpen,
  onOpenMenu,
  onCloseMenu,
}) => {
  if (selectedCount === 0) return null;

  const handleMobileAction = (action: () => void) => {
    onCloseMenu();
    action();
  };

  return (
    <>
      <FloatingContainer>
        <CloseButton onClick={onClear} aria-label="Anuluj zaznaczenie" $hideOnMobile />
        <Stack $gap="md">
          <HeaderWrapper>
            <Flex $align="center" $gap="xs">
              <Text $variant="body3" $weight="medium" as="div">
                <HideOnMobile>Wybrano </HideOnMobile>
              </Text>
              <CountCircle>{selectedCount}</CountCircle>
              <Text $variant="body3" $weight="medium">
                {getPlural(selectedCount)}
              </Text>
            </Flex>

            <MobileActions $gap="sm">
              <Button $variant="primary" $size="sm" onClick={onOpenMenu}>
                Opcje
              </Button>
              <Button $variant="ghost" $size="sm" onClick={onClear}>
                Anuluj
              </Button>
            </MobileActions>
          </HeaderWrapper>

          <DesktopActions $justify="center" $align="center" $gap="md" $wrap="wrap">
            <Button $variant="info" $size="sm" onClick={onRegenerate} style={{ gap: "6px" }}>
              ✨ Regeneruj z AI
            </Button>

            <Button $variant="outline" $size="sm" onClick={onOpenDifficulty}>
              📊 Zmień trudność
            </Button>

            <Button $variant="outline" $size="sm" onClick={onOpenTypeChange}>
              🔄 Zmień typ
            </Button>

            <Button $variant="danger" $size="sm" onClick={onDelete}>
              Usuń zaznaczone
            </Button>

            <Button $variant="ghost" $size="sm" onClick={onClear}>
              Anuluj zaznaczenie
            </Button>
          </DesktopActions>
        </Stack>
      </FloatingContainer>

      <BottomSheet
        isOpen={isMenuOpen}
        onClose={onCloseMenu}
        title={`Opcje dla ${selectedCount} ${getPlural(selectedCount)}`}
      >
        <Stack $gap="sm">
          <SelectableItem onClick={() => handleMobileAction(onRegenerate)}>
            <Flex $gap="sm" $align="center">
              <Text $variant="body1">✨ Regeneruj z AI</Text>
            </Flex>
          </SelectableItem>

          <SelectableItem onClick={() => handleMobileAction(onOpenDifficulty)}>
            <Flex $gap="sm" $align="center">
              <Text $variant="body1">📊 Zmień poziom trudności</Text>
            </Flex>
          </SelectableItem>

          <SelectableItem onClick={() => handleMobileAction(onOpenTypeChange)}>
            <Flex $gap="sm" $align="center">
              <Text $variant="body1">🔄 Zmień typ (Otwarte/Zamknięte)</Text>
            </Flex>
          </SelectableItem>

          <SelectableItem onClick={() => handleMobileAction(onDelete)}>
            <Flex $gap="sm" $align="center">
              <Text $variant="body1" style={{ color: "#d32f2f" }}>🗑️ Usuń zaznaczone</Text>
            </Flex>
          </SelectableItem>
        </Stack>
      </BottomSheet>
    </>
  );
};

export default BulkActionBar;
