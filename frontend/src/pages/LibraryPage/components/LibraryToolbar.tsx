import React, { useState } from "react";
import styled from "styled-components";
import { Flex, Box, Input, Button } from "../../../design-system/primitives";
import { CustomSelect } from "../../../design-system/patterns";
import type { SelectOption } from "../../../design-system/patterns";
import SegmentedToggle from "../../../design-system/patterns/SegmentedToggle";
import type { LibraryFilterState, SortOption, SortDirection } from "../utils/libraryFilters";
import { hasActiveFilters } from "../utils/libraryFilters";
import { SearchIcon, DownloadIcon, TrashIcon, XIcon, TestIcon } from "./LibraryToolbarIcons";

const SORT_COMBO_VALUES: { value: string; label: string; sortBy: SortOption; sortDirection: SortDirection }[] = [
  { value: "date_desc", label: "Data (najnowsze)", sortBy: "date", sortDirection: "desc" },
  { value: "date_asc", label: "Data (najstarsze)", sortBy: "date", sortDirection: "asc" },
  { value: "name_asc", label: "Nazwa A–Z", sortBy: "name", sortDirection: "asc" },
  { value: "name_desc", label: "Nazwa Z–A", sortBy: "name", sortDirection: "desc" },
  { value: "size_asc", label: "Rozmiar ↑", sortBy: "size", sortDirection: "asc" },
  { value: "size_desc", label: "Rozmiar ↓", sortBy: "size", sortDirection: "desc" },
  { value: "pages_asc", label: "Strony ↑", sortBy: "pages", sortDirection: "asc" },
  { value: "pages_desc", label: "Strony ↓", sortBy: "pages", sortDirection: "desc" },
];

const SORT_OPTIONS: SelectOption[] = SORT_COMBO_VALUES.map((o) => ({ value: o.value, label: o.label }));

function toSortComboValue(sortBy: SortOption, sortDirection: SortDirection): string {
  const found = SORT_COMBO_VALUES.find((o) => o.sortBy === sortBy && o.sortDirection === sortDirection);
  return found?.value ?? "date_desc";
}

function fromSortComboValue(value: string): { sortBy: SortOption; sortDirection: SortDirection } {
  const found = SORT_COMBO_VALUES.find((o) => o.value === value);
  return found ? { sortBy: found.sortBy, sortDirection: found.sortDirection } : { sortBy: "date", sortDirection: "desc" };
}

const FILE_TYPE_LABELS: Record<string, string> = {
  "": "Wszystkie formaty pliku",
  pdf: "PDF",
  docx: "DOCX",
  image: "Obrazy",
  text: "TXT / MD",
};

const FILE_TYPE_OPTIONS: SelectOption[] = Object.entries(FILE_TYPE_LABELS).map(([value, label]) => ({ value, label }));

export type ViewMode = "grid" | "list";

interface LibraryToolbarProps {
  filterState: LibraryFilterState;
  onFilterChange: (patch: Partial<LibraryFilterState>) => void;
  onClearFilters: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  selectedCount: number;
  onBulkDownload: () => void;
  onBulkDelete: () => void;
  onBulkUseInTest: () => void;
  onClearSelection: () => void;
}

const TOOLBAR_HEIGHT = 48;

const ToolbarRoot = styled(Flex)`
  width: 100%;
  align-items: center;
  justify-content: space-between;
  min-height: ${TOOLBAR_HEIGHT}px;
  padding: 0;
  gap: ${({ theme }) => theme.spacing.md};
  flex-wrap: nowrap;

  ${({ theme }) => theme.media.down("md")} {
    flex-wrap: wrap;
    align-items: flex-start;
    gap: ${({ theme }) => theme.spacing.sm};
    min-height: auto;
    padding: ${({ theme }) => theme.spacing.sm} 0;
  }
`;

const SearchGroup = styled(Flex)`
  flex: 0 1 auto;
  min-width: 0;
  align-items: center;
  max-width: 400px;

  ${({ theme }) => theme.media.down("md")} {
    flex: 1 1 100%;
    max-width: none;
    order: 1;
  }
`;

const SearchInput = styled(Input)<{ $focused?: boolean }>`
  flex: 1;
  min-width: 120px;
  height: 40px;
  padding-left: 36px;
  border-radius: ${({ theme }) => theme.radii.sm};
  border: 1px solid ${({ theme }) => theme.colors.neutral.greyBlue};
  background: ${({ theme }) => theme.colors.neutral.white};
  font-size: 14px;
  transition: max-width 0.2s ease;

  &::placeholder {
    color: ${({ theme }) => theme.colors.neutral.lGrey};
  }
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.brand.primary};
    box-shadow: 0 0 0 2px rgba(76, 175, 79, 0.15);
  }
`;

const SearchIconWrap = styled(Box)`
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: ${({ theme }) => theme.colors.neutral.grey};
  pointer-events: none;
`;

const SearchWrap = styled(Box)`
  position: relative;
  flex: 1;
  min-width: 0;
  max-width: 320px;

  ${({ theme }) => theme.media.down("md")} {
    max-width: none;
    width: 100%;
  }
`;

const RightGroup = styled(Flex)`
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  flex-shrink: 0;
  margin-left: auto;

  ${({ theme }) => theme.media.down("md")} {
    flex: 1 1 100%;
    margin-left: 0;
    order: 2;
    flex-wrap: wrap;
    gap: ${({ theme }) => theme.spacing.sm};
    align-items: flex-start;
  }
`;

const FiltersGroup = styled(Flex)`
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-shrink: 0;

  ${({ theme }) => theme.media.down("md")} {
    flex: 1 1 auto;
    flex-wrap: wrap;
    min-width: 0;
    gap: ${({ theme }) => theme.spacing.sm};
  }
`;

const CompactSelectWrap = styled(Box)`
  min-width: 220px;
  width: auto;

  ${({ theme }) => theme.media.down("md")} {
    min-width: 0;
    flex: 1 1 140px;
    max-width: 100%;
  }
`;

const ViewToggleWrap = styled(Box)`
  flex-shrink: 0;

  ${({ theme }) => theme.media.down("md")} {
    flex-shrink: 0;
  }
`;

const BulkSelectionLabel = styled(Box)`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.neutral.dGrey};
  flex-shrink: 0;

  ${({ theme }) => theme.media.down("md")} {
    flex: 1 1 100%;
    order: 1;
  }
`;

const BulkBar = styled(Flex)`
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  flex: 1;
  min-width: 0;
  justify-content: flex-end;

  ${({ theme }) => theme.media.down("md")} {
    flex-wrap: wrap;
    flex: 1 1 100%;
    justify-content: flex-start;
    gap: ${({ theme }) => theme.spacing.sm};
    order: 2;
  }
`;

const BulkButton = styled(Button)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 40px;

  ${({ theme }) => theme.media.down("md")} {
    flex: 1 1 auto;
    min-width: 0;
    font-size: 13px;
    padding-left: ${({ theme }) => theme.spacing.sm};
    padding-right: ${({ theme }) => theme.spacing.sm};
  }
`;

const LibraryToolbar: React.FC<LibraryToolbarProps> = ({
  filterState,
  onFilterChange,
  onClearFilters,
  viewMode,
  onViewModeChange,
  selectedCount,
  onBulkDownload,
  onBulkDelete,
  onBulkUseInTest,
  onClearSelection,
}) => {
  const [searchFocused, setSearchFocused] = useState(false);

  const handleSortChange = (value: string) => {
    const { sortBy, sortDirection } = fromSortComboValue(value);
    onFilterChange({ sortBy, sortDirection });
  };

  const isSelectionMode = selectedCount > 0;

  return (
    <ToolbarRoot>
      {isSelectionMode ? (
        <>
          <BulkSelectionLabel>
            Zaznaczono: {selectedCount}
          </BulkSelectionLabel>
          <BulkBar>
            <BulkButton $variant="primary" $size="md" onClick={onBulkUseInTest}>
              <TestIcon /> Użyj do testu
            </BulkButton>
            <BulkButton $variant="outline" $size="md" onClick={onBulkDownload}>
              <DownloadIcon /> Pobierz
            </BulkButton>
            <BulkButton $variant="danger" $size="md" onClick={onBulkDelete}>
              <TrashIcon /> Usuń
            </BulkButton>
            <BulkButton $variant="ghost" $size="md" onClick={onClearSelection}>
              <XIcon /> Odznacz
            </BulkButton>
          </BulkBar>
        </>
      ) : (
        <>
          <SearchGroup>
            <SearchWrap>
              <SearchIconWrap>
                <SearchIcon />
              </SearchIconWrap>
              <SearchInput
                type="search"
                placeholder="Szukaj po nazwie"
                value={filterState.searchQuery}
                onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                aria-label="Szukaj po nazwie pliku"
                $focused={searchFocused}
              />
            </SearchWrap>
          </SearchGroup>

          <RightGroup>
            <FiltersGroup>
              <CompactSelectWrap>
                <CustomSelect
                  options={FILE_TYPE_OPTIONS}
                  value={filterState.fileTypeFilter}
                  onChange={(v) => onFilterChange({ fileTypeFilter: v })}
                  placeholder="Typ"
                  $fullWidth={true}
                />
              </CompactSelectWrap>
              <CompactSelectWrap>
                <CustomSelect
                  options={SORT_OPTIONS}
                  value={toSortComboValue(filterState.sortBy, filterState.sortDirection)}
                  onChange={handleSortChange}
                  placeholder="Sortuj"
                  $fullWidth={true}
                />
              </CompactSelectWrap>
              {hasActiveFilters(filterState) && (
                <Button $variant="ghost" $size="md" onClick={onClearFilters} style={{ height: 40 }}>
                  Wyczyść filtry
                </Button>
              )}
            </FiltersGroup>
            <ViewToggleWrap>
              <SegmentedToggle<ViewMode>
                options={[
                  { label: "Siatka", value: "grid" },
                  { label: "Lista", value: "list" },
                ]}
                value={viewMode}
                onChange={onViewModeChange}
              />
            </ViewToggleWrap>
          </RightGroup>
        </>
      )}
    </ToolbarRoot>
  );
};

export default LibraryToolbar;
