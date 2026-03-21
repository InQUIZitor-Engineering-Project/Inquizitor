import React, { useMemo, useState } from "react";
import { useTheme } from "styled-components";
import {
  SidebarWrapper,
  SearchInput,
  TestList,
  TestItem,
  CreateNewButton,
  DeleteIcon,
  ToggleButton,
  SidebarInner,
} from "./Sidebar.styles";
import trashIcon from "../../assets/icons/Trash.webp";

export interface SidebarProps {
  tests: { id: number; title: string }[];
  onSelect: (testId: number) => void;
  onCreateNew: () => void;
  onDelete: (testId: number) => void;
  isDrawerOpen?: boolean;
  onCloseDrawer?: () => void;
  isHidden?: boolean;
  onToggleHide?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  tests,
  onSelect,
  onCreateNew,
  onDelete,
  isDrawerOpen,
  onCloseDrawer,
  isHidden,
  onToggleHide,
}) => {
  const [query, setQuery] = useState("");
  const theme = useTheme();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tests;
    return tests.filter((t) => (t.title || "").toLowerCase().includes(q));
  }, [tests, query]);

  const handleDeleteClick = (
    e: React.MouseEvent<HTMLImageElement>,
    testId: number
  ) => {
    e.stopPropagation();
    onDelete(testId);
  };

  return (
    <SidebarWrapper $isDrawerOpen={isDrawerOpen} $isHidden={isHidden}>
      <ToggleButton 
        $isHidden={isHidden} 
        onClick={onToggleHide} 
        aria-label={isHidden ? "Pokaż pasek boczny" : "Ukryj pasek boczny"}
      />
      
      <SidebarInner $isHidden={isHidden}>
        <SearchInput
          placeholder="Wyszukaj…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Wyszukaj test"
        />

        <TestList>
          {filtered.length === 0 ? (
            <div style={{ padding: "12px", color: theme.colors.neutral.grey, fontSize: 12 }}>
              Brak wyników.
            </div>
          ) : (
            filtered.map((t) => (
              <TestItem
                key={t.id}
                onClick={() => {
                  onSelect(t.id);
                  onCloseDrawer?.();
                }}
              >
                <span>{t.title}</span>
                <DeleteIcon
                  src={trashIcon}
                  alt="Usuń"
                  onClick={(e) => handleDeleteClick(e, t.id)}
                  title="Usuń test"
                  style={{ 
                    filter: theme.colorTheme === 'dark' ? "brightness(0) invert(1)" : "none", 
                    opacity: 0.6 
                  }}
                />
              </TestItem>
            ))
          )}
        </TestList>

        <CreateNewButton
          onClick={() => {
            onCreateNew();
            onCloseDrawer?.();
          }}
        >
          + Utwórz nowy
        </CreateNewButton>
      </SidebarInner>
    </SidebarWrapper>
  );
};

export default Sidebar;
