import React from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import { Box, Flex, Button, Text, Stack, CloseButton } from "../../../design-system/primitives";
import { BottomSheet, SelectableItem, PageContainer } from "../../../design-system/patterns";

const ActionBarPortalWrapper = styled.div`
  /* Fixed to visual viewport so it stays visible under mobile browser chrome */
  position: fixed;
  bottom: 12px; /* fallback when env() not supported */
  bottom: calc(12px + env(safe-area-inset-bottom));
  left: 0;
  right: 0;
  z-index: 1000;
  pointer-events: none;
  display: flex;
  justify-content: center;

  @media (min-width: 600px) {
    bottom: 24px; /* fallback when env() not supported */
    bottom: calc(24px + env(safe-area-inset-bottom));
  }
`;

const FloatingContainer = styled(Box)`
  position: relative;
  pointer-events: auto;
  width: 100%;
  max-width: 960px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(0, 0, 0, 0.08);
  padding: 12px 16px;
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  @media (min-width: 600px) {
    width: 70%;
    padding: 16px 24px;
  }

  @keyframes slideUp {
    from {
      transform: translateY(120%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
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

const getPluralNominative = (count: number): string => {
  const absCount = Math.abs(count);
  if (absCount === 1) return "pytanie";
  
  const lastDigit = absCount % 10;
  const lastTwoDigits = absCount % 100;

  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 10 || lastTwoDigits >= 20)) {
    return "pytania";
  }
  return "pytań";
};

const getPluralGenitive = (count: number): string => {
  const absCount = Math.abs(count);
  if (absCount === 1) return "pytania";
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

  const content = (
    <>
      <ActionBarPortalWrapper>
        <PageContainer style={{ display: 'flex', justifyContent: 'center' }}>
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
                    {getPluralNominative(selectedCount)}
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
        </PageContainer>
      </ActionBarPortalWrapper>

      <BottomSheet
        isOpen={isMenuOpen}
        onClose={onCloseMenu}
        title={`Opcje dla ${selectedCount} ${getPluralGenitive(selectedCount)}`}
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

  const mountNode = document.getElementById("main-content-area");
  return mountNode ? createPortal(content, mountNode) : content;
};

export default BulkActionBar;
