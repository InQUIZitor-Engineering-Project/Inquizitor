import React from "react";
import {
  SidebarWrapper,
  SearchInput,
  TestList,
  TestItem,
  CreateNewButton,
} from "./Sidebar.styles";

export interface SidebarProps {
  tests: { id: number; title: string }[];
  onSelect: (testId: number) => void;
  onCreateNew: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ tests, onSelect, onCreateNew }) => {
  return (
    <SidebarWrapper>
      <SearchInput placeholder="Wyszukaj..." />
      <TestList>
        {tests.map((t) => (
          <TestItem key={t.id} onClick={() => onSelect(t.id)}>
            {t.title}
          </TestItem>
        ))}
      </TestList>
      <CreateNewButton onClick={onCreateNew}>
        + Utwórz nowy
      </CreateNewButton>
    </SidebarWrapper>
  );
};

export default Sidebar;
