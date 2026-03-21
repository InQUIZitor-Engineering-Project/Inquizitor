import React from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import { Box, Flex, Button, Text, Stack, CloseButton } from "../../../design-system/primitives";
import { BottomSheet, SelectableItem } from "../../../design-system/patterns";

const ActionBarPortalWrapper = styled.div`
  /* Position absolute relative to main-content-area so it centers within content, not viewport */
  position: absolute;
  bottom: calc(12px + env(safe-area-inset-bottom));
  left: 0;
  right: 0;
  z-index: 1000;
  pointer-events: none;
  display: flex;
  justify-content: center;

  @media (min-width: 600px) {
    bottom: calc(24px + env(safe-area-inset-bottom));
  }

  @media (min-width: 1025px) {
    /* Offset for the scrollbar width to match the centered question cards.
       The scrollable area has a scrollbar, but this portal wrapper doesn't.
       Adding padding-right compensates for the scrollbar space. */
    padding-right: 15px;
  }
`;

const FloatingContainer = styled(Box)`
  position: relative;
  pointer-events: auto;
  width: 100%;
  max-width: 840px;
  margin: 0 auto;
  background: ${({ theme }) => theme.colors.neutral.white};
  border-radius: 16px;
  box-shadow: ${({ theme }) => theme.elevation["2xl"]};
  border: 1px solid ${({ theme }) => theme.colors.neutral.greyBlue};
  padding: 12px 16px;
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  @media (min-width: 600px) {
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
  color: ${({ theme }) => theme.tone.inverted};
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

const REGENERATE_DISABLED_TITLE = "Zaakceptuj regulamin w ustawieniach, aby odblokować funkcje AI.";

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
  /** Gdy true, przycisk „Regeneruj z AI” jest nieaktywny (np. brak zgody na regulamin). */
  regenerateDisabled?: boolean;
  /** Gdy true, przycisk „Zmień typ” jest nieaktywny (np. brak zgody na regulamin). */
  typeChangeDisabled?: boolean;
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
  regenerateDisabled = false,
  typeChangeDisabled = false,
}) => {
  if (selectedCount === 0) return null;

  const handleMobileAction = (action: () => void) => {
    onCloseMenu();
    action();
  };

  const content = (
    <>
      <ActionBarPortalWrapper>
        <FloatingContainer style={{ margin: '0 16px' }}>
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
                <Button
                  $variant="info"
                  $size="sm"
                  onClick={onRegenerate}
                  disabled={regenerateDisabled}
                  title={regenerateDisabled ? REGENERATE_DISABLED_TITLE : undefined}
                  style={{ gap: "6px" }}
                >
                  ✨ Regeneruj z AI
                </Button>

                <Button $variant="outline" $size="sm" onClick={onOpenDifficulty}>
                  📊 Zmień trudność
                </Button>

                <Button
                  $variant="outline"
                  $size="sm"
                  onClick={onOpenTypeChange}
                  disabled={typeChangeDisabled}
                  title={typeChangeDisabled ? REGENERATE_DISABLED_TITLE : undefined}
                >
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
      </ActionBarPortalWrapper>

      <BottomSheet
        isOpen={isMenuOpen}
        onClose={onCloseMenu}
        title={`Opcje dla ${selectedCount} ${getPluralGenitive(selectedCount)}`}
      >
        <Stack $gap="sm">
          <SelectableItem
            onClick={regenerateDisabled ? undefined : () => handleMobileAction(onRegenerate)}
            style={regenerateDisabled ? { opacity: 0.6, pointerEvents: "none" } : undefined}
          >
            <Flex $gap="sm" $align="center">
              <Text $variant="body1">✨ Regeneruj z AI</Text>
              {regenerateDisabled && (
                <Text $variant="body3" $tone="muted">(wymagana zgoda na regulamin)</Text>
              )}
            </Flex>
          </SelectableItem>

          <SelectableItem onClick={() => handleMobileAction(onOpenDifficulty)}>
            <Flex $gap="sm" $align="center">
              <Text $variant="body1">📊 Zmień poziom trudności</Text>
            </Flex>
          </SelectableItem>

          <SelectableItem
            onClick={typeChangeDisabled ? undefined : () => handleMobileAction(onOpenTypeChange)}
            style={typeChangeDisabled ? { opacity: 0.6, pointerEvents: "none" } : undefined}
          >
            <Flex $gap="sm" $align="center">
              <Text $variant="body1">🔄 Zmień typ (Otwarte/Zamknięte)</Text>
              {typeChangeDisabled && (
                <Text $variant="body3" $tone="muted">(wymagana zgoda na regulamin)</Text>
              )}
            </Flex>
          </SelectableItem>

          <SelectableItem onClick={() => handleMobileAction(onDelete)}>
            <Flex $gap="sm" $align="center">
              <Text $variant="body1" style={{ color: "var(--color-danger-main)" }}>🗑️ Usuń zaznaczone</Text>
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
