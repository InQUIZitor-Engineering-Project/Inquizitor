import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { Box } from "../../../design-system/primitives";
import styled from "styled-components";
import type { MaterialUploadResponse } from "../../../services/materials";
import { TestIcon } from "./LibraryToolbarIcons";

const DROPDOWN_MIN_WIDTH = 180;
const DROPDOWN_ESTIMATE_HEIGHT = 130;
const GAP = 4;

interface MaterialActionsMenuProps {
  material: MaterialUploadResponse;
  onDownload: (materialId: number, filename: string) => void;
  onUseInTest: (materialId: number) => void;
  onDelete: (materialId: number) => void;
  onPreview?: (material: MaterialUploadResponse) => void;
  onRename?: (material: MaterialUploadResponse) => void;
  /** Align dropdown to the right of the trigger (e.g. for card top-right) */
  $alignRight?: boolean;
}

const MenuTrigger = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: transparent;
  color: ${({ theme }) => theme.colors.neutral.grey};
  cursor: pointer;
  padding: 0;

  &:hover {
    background: ${({ theme }) => theme.colors.tint.t5};
    color: ${({ theme }) => theme.colors.neutral.dGrey};
  }
`;

const MenuDropdown = styled(Box)`
  min-width: ${DROPDOWN_MIN_WIDTH}px;
  background: ${({ theme }) => theme.colors.neutral.white};
  border: 1px solid ${({ theme }) => theme.colors.neutral.greyBlue};
  border-radius: ${({ theme }) => theme.radii.sm};
  box-shadow: ${({ theme }) => theme.elevation.lg};
  z-index: 1000;
  padding: 4px;
`;

const MenuItem = styled.button`
  display: flex;
  align-items: center;
  width: 100%;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border: none;
  border-radius: ${({ theme }) => theme.radii.xs};
  background: transparent;
  color: ${({ theme }) => theme.colors.neutral.dGrey};
  font-size: 14px;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.tint.t5};
  }
`;

const MenuItemDanger = styled(MenuItem)`
  color: ${({ theme }) => theme.colors.danger.main};

  &:hover {
    background: ${({ theme }) => theme.colors.danger.hover};
  }
`;

const MenuItemWithIcon = styled(MenuItem)`
  gap: 8px;
`;

const MenuItemIconWrap = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: ${({ theme }) => theme.colors.brand.primary};
`;

const ThreeDotsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="12" cy="6" r="1.5" />
    <circle cx="12" cy="12" r="1.5" />
    <circle cx="12" cy="18" r="1.5" />
  </svg>
);

const MaterialActionsMenu: React.FC<MaterialActionsMenuProps> = ({
  material,
  onDownload,
  onUseInTest,
  onDelete,
  onPreview,
  onRename,
  $alignRight = false,
}) => {
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const style: React.CSSProperties = {};

    // Vertical: prefer below; if would go off bottom, open above
    const spaceBelow = vh - rect.bottom - GAP;
    const spaceAbove = rect.top - GAP;
    if (spaceBelow >= DROPDOWN_ESTIMATE_HEIGHT || spaceBelow >= spaceAbove) {
      style.top = rect.bottom + GAP;
      style.bottom = "auto";
    } else {
      style.bottom = vh - rect.top + GAP;
      style.top = "auto";
    }

    // Horizontal: for $alignRight (grid) align right edge to trigger; else (list) align left to trigger, but keep in viewport
    if ($alignRight) {
      const left = rect.right - DROPDOWN_MIN_WIDTH;
      if (left < 0) {
        style.left = GAP;
        style.right = "auto";
      } else {
        style.left = left;
        style.right = "auto";
      }
    } else {
      if (rect.left + DROPDOWN_MIN_WIDTH > vw - GAP) {
        style.left = Math.max(GAP, rect.right - DROPDOWN_MIN_WIDTH);
        style.right = "auto";
      } else {
        style.left = rect.left;
        style.right = "auto";
      }
    }

    setDropdownStyle(style);
  }, [open, $alignRight]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const inTrigger = containerRef.current?.contains(target);
      const inDropdown = dropdownRef.current?.contains(target);
      if (!inTrigger && !inDropdown) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDownload(material.id, material.filename);
    setOpen(false);
  };

  const handleUseInTest = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUseInTest(material.id);
    setOpen(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(material.id);
    setOpen(false);
  };

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPreview?.(material);
    setOpen(false);
  };

  const handleRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRename?.(material);
    setOpen(false);
  };

  const dropdownContent =
    open &&
    createPortal(
      <div ref={dropdownRef} style={{ position: "fixed", zIndex: 1000, ...dropdownStyle }}>
        <MenuDropdown as="div">
          <MenuItemWithIcon type="button" onClick={handleUseInTest}>
            <MenuItemIconWrap><TestIcon /></MenuItemIconWrap>
            Użyj do testu
          </MenuItemWithIcon>
          {onPreview && (
            <MenuItem type="button" onClick={handlePreview}>
              Podgląd
            </MenuItem>
          )}
          <MenuItem type="button" onClick={handleDownload}>
            Pobierz
          </MenuItem>
          {onRename && (
            <MenuItem type="button" onClick={handleRename}>
              Zmień nazwę
            </MenuItem>
          )}
          <MenuItemDanger type="button" onClick={handleDelete}>
            Usuń
          </MenuItemDanger>
        </MenuDropdown>
      </div>,
      document.body
    );

  return (
    <Box ref={containerRef} style={{ position: "relative", display: "inline-block" }}>
      <MenuTrigger
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label="Menu akcji"
        aria-expanded={open}
      >
        <ThreeDotsIcon />
      </MenuTrigger>
      {dropdownContent}
    </Box>
  );
};

export default MaterialActionsMenu;
