import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import { Box, Flex } from "../../../design-system/primitives";

export interface GroupTabItem {
  id: string;
  label: string;
}

const MENU_GAP = 4;
const MENU_MIN_WIDTH = 160;

export interface GroupTabsProps {
  groups: GroupTabItem[];
  activeGroupId: string;
  onGroupChange: (id: string) => void;
  /** Dodanie pustej grupy (wywoływane też z menu „Pusta grupa”) */
  onAddGroup: () => void;
  /** Duplikuj obecną grupę (opcja w menu Add) */
  onDuplicateCurrentGroup?: () => void;
  /** Generuj wariant AI (opcja w menu Add) */
  onGenerateAIVariant?: () => void;
  /** Zmiana nazwy grupy (np. po wyborze z menu) */
  onRenameGroup?: (id: string) => void;
  /** Usunięcie grupy (np. po wyborze z menu) */
  onRemoveGroup?: (id: string) => void;
  onTabContextMenu?: (id: string, e: React.MouseEvent) => void;
}

/** Wrapper: segmented control + add button side by side */
const GroupTabsWrapper = styled(Flex).attrs({
  $align: "center",
  $gap: "xs",
})`
  flex-wrap: wrap;
`;

/** Track (container): must have visible background for contrast with white active card */
const TabBar = styled.nav`
  display: inline-flex;
  align-items: stretch;
  position: relative;
  padding: 4px; /* p-1: gap between track and tabs */
  border-radius: ${({ theme }) => theme.radii.lg};
  background: #e5e7eb; /* gray-200: clear contrast vs white card and light page bg */
  isolation: isolate;
`;

/** Sliding "card" on the track: white, shadow-sm */
const TabIndicator = styled.div<{ $left: number; $width: number }>`
  position: absolute;
  z-index: 1;
  top: 4px;
  bottom: 4px;
  left: ${({ $left }) => $left}px;
  width: ${({ $width }) => $width}px;
  background: ${({ theme }) => theme.colors.neutral.white};
  border-radius: ${({ theme }) => theme.radii.sm};
  box-shadow: ${({ theme }) => theme.elevation.sm};
  border: 1px solid rgba(0, 0, 0, 0.06);
  transition: left 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
`;

/** Tab: inactive = transparent + gray-500; active = brand green text (indicator = white card) */
const Tab = styled.button<{ $active: boolean }>`
  position: relative;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: none;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: transparent;
  color: ${({ $active, theme }) =>
    $active ? theme.colors.shade.s2 : theme.colors.neutral.grey};
  font-size: 14px;
  font-weight: ${({ $active }) => ($active ? 600 : 400)};
  cursor: pointer;
  transition: color 0.2s ease, background-color 0.2s ease;

  &:hover {
    color: ${({ $active, theme }) =>
      $active ? theme.colors.shade.s2 : theme.colors.neutral.dGrey};
  }

  &:not([aria-selected="true"]):hover {
    background: rgba(229, 231, 235, 0.5); /* gray-200/50 */
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.brand.primary};
    outline-offset: 2px;
  }
`;

/** Chevron (▼): small, inherits green when active */
const TabMenuTrigger = styled.button.attrs({ type: "button" })<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 12px;
  height: 12px;
  border: none;
  border-radius: ${({ theme }) => theme.radii.xs};
  color: inherit;
  opacity: ${({ $active }) => ($active ? 1 : 0.7)};
  font-size: 8px;
  line-height: 1;
  flex-shrink: 0;
  cursor: pointer;
  background: transparent;

  &:hover {
    opacity: 1;
    background: rgba(0, 0, 0, 0.06);
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.brand.primary};
    outline-offset: 1px;
  }
`;

/** Ghost button outside the control: circular/rounded, Plus icon, green hover */
const AddGroupButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: transparent;
  color: ${({ theme }) => theme.colors.neutral.grey};
  cursor: pointer;
  transition: color 0.2s ease, background-color 0.2s ease;

  &:hover {
    color: ${({ theme }) => theme.colors.brand.primary};
    background: ${({ theme }) => theme.colors.tint.t5};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.brand.primary};
    outline-offset: 2px;
  }
`;

/** Add Group dropdown: ten sam styl co inne dropdowny (radii.sm, greyBlue border) */
const AddMenuPopover = styled.div<{ $visible: boolean }>`
  position: absolute;
  width: 224px; /* w-56 */
  padding: ${({ theme }) => theme.spacing.xs};
  background: ${({ theme }) => theme.colors.neutral.white};
  border-radius: ${({ theme }) => theme.radii.sm};
  box-shadow: ${({ theme }) => theme.elevation.lg};
  border: 1px solid ${({ theme }) => theme.colors.neutral.greyBlue};
  z-index: 50;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transform: scale(${({ $visible }) => ($visible ? 1 : 0.96)});
  transition: opacity 0.15s ease-out, transform 0.15s ease-out;
  pointer-events: ${({ $visible }) => ($visible ? "auto" : "none")};
`;

const AddMenuDivider = styled.div`
  height: 1px;
  background: #f3f4f6;
  margin: ${({ theme }) => theme.spacing.xxs} 0;
`;

/** Standard item: gray-700, hover:gray-50 */
const AddMenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: none;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: transparent;
  color: #374151; /* gray-700 */
  font-size: 14px;
  font-weight: 400;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background: #f9fafb; /* gray-50 */
  }
`;

/** Featured AI item: blue-600 icon, blue-700 text, hover:blue-50 */
const AddMenuItemFeatured = styled(AddMenuItem)`
  color: #1d4ed8; /* blue-700 */
  font-weight: 500;

  &:hover {
    background: #eff6ff; /* blue-50 */
  }
`;

const AddMenuItemIcon = styled.span<{ $featured?: boolean }>`
  display: inline-flex;
  flex-shrink: 0;
  color: ${({ $featured }) => ($featured ? "#2563eb" : "#374151")}; /* blue-600 / gray-700 */
`;

const GroupMenuDropdown = styled(Box).attrs({ as: "div" })`
  min-width: ${MENU_MIN_WIDTH}px;
  background: ${({ theme }) => theme.colors.neutral.white};
  border: 1px solid ${({ theme }) => theme.colors.neutral.greyBlue};
  border-radius: ${({ theme }) => theme.radii.sm};
  box-shadow: ${({ theme }) => theme.elevation.lg};
  z-index: 1000;
  padding: 4px;
`;

const GroupMenuItem = styled.button`
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

const GroupMenuItemDanger = styled(GroupMenuItem)`
  color: ${({ theme }) => theme.colors.danger.main};

  &:hover {
    background: ${({ theme }) => theme.colors.danger.hover};
  }
`;

const PlusIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const CopyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
);

const FilePlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="12" y1="18" x2="12" y2="12" />
    <line x1="9" y1="15" x2="15" y2="15" />
  </svg>
);

const ADD_MENU_MARGIN_TOP = 8; /* mt-2 */

const GroupTabs: React.FC<GroupTabsProps> = ({
  groups,
  activeGroupId,
  onGroupChange,
  onAddGroup,
  onDuplicateCurrentGroup,
  onGenerateAIVariant,
  onRenameGroup,
  onRemoveGroup,
  onTabContextMenu,
}) => {
  const [menuOpenForId, setMenuOpenForId] = useState<string | null>(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const [addMenuStyle, setAddMenuStyle] = useState<React.CSSProperties>({});
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabBarRef = useRef<HTMLElement>(null);
  const tabsRef = useRef<Map<string, HTMLButtonElement>>(new Map());
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const menuDropdownRef = useRef<HTMLDivElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const activeEl = tabsRef.current.get(activeGroupId);
    const bar = tabBarRef.current;
    if (activeEl && bar) {
      const barRect = bar.getBoundingClientRect();
      const btnRect = activeEl.getBoundingClientRect();
      setIndicatorStyle({
        left: btnRect.left - barRect.left,
        width: btnRect.width,
      });
    }
  }, [activeGroupId, groups]);

  useLayoutEffect(() => {
    if (menuOpenForId === null || !menuTriggerRef.current) return;
    const rect = menuTriggerRef.current.getBoundingClientRect();
    const vh = window.innerHeight;
    const spaceBelow = vh - rect.bottom - MENU_GAP;
    if (spaceBelow >= 80) {
      setMenuStyle({ top: rect.bottom + MENU_GAP, left: rect.left, bottom: "auto" });
    } else {
      setMenuStyle({ top: "auto", bottom: vh - rect.top + MENU_GAP, left: rect.left });
    }
  }, [menuOpenForId]);

  useLayoutEffect(() => {
    if (!addMenuOpen || !addButtonRef.current) return;
    const rect = addButtonRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const menuWidth = 224;
    const left = rect.left + rect.width - menuWidth >= 0 ? rect.left + rect.width - menuWidth : rect.left;
    if (rect.left + menuWidth > vw - 16) {
      setAddMenuStyle({
        top: rect.bottom + ADD_MENU_MARGIN_TOP,
        left: Math.max(16, vw - menuWidth - 16),
      });
    } else {
      setAddMenuStyle({
        top: rect.bottom + ADD_MENU_MARGIN_TOP,
        left,
      });
    }
  }, [addMenuOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuDropdownRef.current?.contains(target)) return;
      if (menuTriggerRef.current?.contains(target)) return;
      setMenuOpenForId(null);
      if (addMenuRef.current?.contains(target)) return;
      if (addButtonRef.current?.contains(target)) return;
      setAddMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openMenu = (group: GroupTabItem, el: HTMLButtonElement) => {
    menuTriggerRef.current = el;
    setMenuOpenForId((prev) => (prev === group.id ? null : group.id));
  };

  const closeMenu = () => setMenuOpenForId(null);

  const handleRename = (id: string) => {
    onRenameGroup?.(id);
    closeMenu();
  };

  const handleRemove = (id: string) => {
    onRemoveGroup?.(id);
    closeMenu();
  };

  const closeAddMenu = () => setAddMenuOpen(false);

  const handleAddEmptyGroup = () => {
    onAddGroup();
    closeAddMenu();
  };

  const handleDuplicateCurrent = () => {
    onDuplicateCurrentGroup?.();
    closeAddMenu();
  };

  const handleGenerateAIVariant = () => {
    onGenerateAIVariant?.();
    closeAddMenu();
  };

  const menuDropdown =
    menuOpenForId !== null &&
    createPortal(
      <div ref={menuDropdownRef} style={{ position: "fixed", zIndex: 1000, ...menuStyle }}>
        <GroupMenuDropdown>
          {onRenameGroup && (
            <GroupMenuItem type="button" onClick={() => handleRename(menuOpenForId)}>
              Zmień nazwę
            </GroupMenuItem>
          )}
          {onRemoveGroup && (
            <GroupMenuItemDanger type="button" onClick={() => handleRemove(menuOpenForId)}>
              Usuń grupę
            </GroupMenuItemDanger>
          )}
          {!onRenameGroup && !onRemoveGroup && (
            <GroupMenuItem type="button" onClick={closeMenu}>
              Opcje wkrótce
            </GroupMenuItem>
          )}
        </GroupMenuDropdown>
      </div>,
      document.body
    );

  const addMenuDropdown =
    addMenuOpen &&
    createPortal(
      <div ref={addMenuRef} style={{ position: "fixed", zIndex: 50, ...addMenuStyle }}>
        <AddMenuPopover $visible={addMenuOpen}>
          {onGenerateAIVariant && (
            <AddMenuItemFeatured type="button" onClick={handleGenerateAIVariant}>
              <AddMenuItemIcon $featured>✨</AddMenuItemIcon>
              Generuj wariant AI
            </AddMenuItemFeatured>
          )}
          {onGenerateAIVariant && <AddMenuDivider />}
          {onDuplicateCurrentGroup && (
            <AddMenuItem type="button" onClick={handleDuplicateCurrent}>
              <AddMenuItemIcon>
                <CopyIcon />
              </AddMenuItemIcon>
              Duplikuj obecną
            </AddMenuItem>
          )}
          <AddMenuItem type="button" onClick={handleAddEmptyGroup}>
            <AddMenuItemIcon>
              <FilePlusIcon />
            </AddMenuItemIcon>
            Pusta grupa
          </AddMenuItem>
        </AddMenuPopover>
      </div>,
      document.body
    );

  return (
    <>
      <GroupTabsWrapper as="div">
        <TabBar ref={tabBarRef} role="tablist" aria-label="Grupy pytań">
          <TabIndicator $left={indicatorStyle.left} $width={indicatorStyle.width} />
          {groups.map((group) => {
            const isActive = activeGroupId === group.id;
            const isMenuOpen = menuOpenForId === group.id;
            return (
              <Tab
                key={group.id}
                ref={(el) => {
                  if (el) tabsRef.current.set(group.id, el);
                  else tabsRef.current.delete(group.id);
                }}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`group-panel-${group.id}`}
                id={`group-tab-${group.id}`}
                $active={isActive}
                onClick={() => onGroupChange(group.id)}
                onContextMenu={
                  onTabContextMenu
                    ? (e) => {
                        e.preventDefault();
                        onTabContextMenu(group.id, e);
                      }
                    : undefined
                }
              >
                <span>{group.label}</span>
                <TabMenuTrigger
                  ref={(el) => {
                    if (isMenuOpen) menuTriggerRef.current = el;
                  }}
                  $active={isActive}
                  aria-label="Opcje grupy"
                  aria-expanded={isMenuOpen}
                  title="Opcje grupy (zmień nazwę, usuń)"
                  onClick={(e) => {
                    e.stopPropagation();
                    openMenu(group, e.currentTarget);
                  }}
                >
                  ▼
                </TabMenuTrigger>
              </Tab>
            );
          })}
        </TabBar>
        <AddGroupButton
          ref={addButtonRef}
          type="button"
          onClick={() => setAddMenuOpen((open) => !open)}
          aria-label="Dodaj grupę"
          aria-expanded={addMenuOpen}
          aria-haspopup="menu"
          title="Dodaj grupę"
        >
          <PlusIcon />
        </AddGroupButton>
      </GroupTabsWrapper>
      {menuDropdown}
      {addMenuDropdown}
    </>
  );
};

export default GroupTabs;
