/**
 * Filter and sort logic for the materials library (client-side).
 */

import type { MaterialUploadResponse } from "../../../services/materials";

/** File type category for filtering */
export type FileTypeCategory = "pdf" | "docx" | "image" | "text" | "other";

export function getFileTypeCategory(m: MaterialUploadResponse): FileTypeCategory {
  const mime = (m.mime_type || "").toLowerCase();
  const name = (m.filename || "").toLowerCase();
  if (mime === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (
    mime.includes("wordprocessingml") ||
    mime.includes("document") ||
    name.endsWith(".docx")
  )
    return "docx";
  if (mime.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/i.test(name))
    return "image";
  if (
    mime.includes("text/") ||
    name.endsWith(".txt") ||
    name.endsWith(".md")
  )
    return "text";
  return "other";
}

export type SortOption = "date" | "name" | "size" | "pages";
export type SortDirection = "asc" | "desc";

export interface LibraryFilterState {
  searchQuery: string;
  fileTypeFilter: string;
  sortBy: SortOption;
  sortDirection: SortDirection;
}

export const DEFAULT_FILTER_STATE: LibraryFilterState = {
  searchQuery: "",
  fileTypeFilter: "",
  sortBy: "date",
  sortDirection: "desc",
};

/** Returns true if material matches current filters */
export function filterMaterials(
  materials: MaterialUploadResponse[],
  state: LibraryFilterState
): MaterialUploadResponse[] {
  const q = state.searchQuery.trim().toLowerCase();
  const fileType = state.fileTypeFilter;

  return materials.filter((m) => {
    if (q && !(m.filename || "").toLowerCase().includes(q)) return false;
    if (fileType && getFileTypeCategory(m) !== fileType) return false;
    return true;
  });
}

/** Sorts materials by the given option and direction (stable sort) */
export function sortMaterials(
  materials: MaterialUploadResponse[],
  sortBy: SortOption,
  sortDirection: SortDirection
): MaterialUploadResponse[] {
  const dir = sortDirection === "asc" ? 1 : -1;
  return [...materials].sort((a, b) => {
    let cmp = 0;
    switch (sortBy) {
      case "date": {
        const ta = new Date(a.created_at).getTime();
        const tb = new Date(b.created_at).getTime();
        cmp = ta - tb;
        break;
      }
      case "name": {
        const na = (a.filename || "").toLowerCase();
        const nb = (b.filename || "").toLowerCase();
        cmp = na.localeCompare(nb, "pl");
        break;
      }
      case "size": {
        const sa = a.size_bytes ?? 0;
        const sb = b.size_bytes ?? 0;
        cmp = sa - sb;
        break;
      }
      case "pages": {
        const pa = a.page_count ?? 0;
        const pb = b.page_count ?? 0;
        cmp = pa - pb;
        break;
      }
      default:
        cmp = 0;
    }
    return cmp * dir;
  });
}

/** Apply filter then sort */
export function filterAndSortMaterials(
  materials: MaterialUploadResponse[],
  state: LibraryFilterState
): MaterialUploadResponse[] {
  const filtered = filterMaterials(materials, state);
  return sortMaterials(filtered, state.sortBy, state.sortDirection);
}

/** Check if any filter is active (for showing "Clear filters" and chips) */
export function hasActiveFilters(state: LibraryFilterState): boolean {
  return (
    state.searchQuery.trim() !== "" ||
    state.fileTypeFilter !== ""
  );
}

/** Build URL search params from filter state (only non-default values) */
export function filterStateToSearchParams(state: LibraryFilterState): Record<string, string> {
  const params: Record<string, string> = {};
  if (state.searchQuery.trim()) params.q = state.searchQuery.trim();
  if (state.fileTypeFilter) params.type = state.fileTypeFilter;
  if (state.sortBy !== DEFAULT_FILTER_STATE.sortBy || state.sortDirection !== DEFAULT_FILTER_STATE.sortDirection) {
    params.sort = state.sortBy;
    params.order = state.sortDirection;
  }
  return params;
}

/** Parse URL search params into filter state (merge over defaults) */
export function searchParamsToFilterState(params: URLSearchParams): LibraryFilterState {
  const q = params.get("q")?.trim() ?? "";
  const type = params.get("type") ?? "";
  const sortBy = (params.get("sort") as SortOption) ?? DEFAULT_FILTER_STATE.sortBy;
  const order = (params.get("order") as SortDirection) ?? DEFAULT_FILTER_STATE.sortDirection;
  const validSortBy: SortOption[] = ["date", "name", "size", "pages"];
  const validOrder: SortDirection[] = ["asc", "desc"];
  return {
    searchQuery: q,
    fileTypeFilter: type,
    sortBy: validSortBy.includes(sortBy) ? sortBy : DEFAULT_FILTER_STATE.sortBy,
    sortDirection: validOrder.includes(order) ? order : DEFAULT_FILTER_STATE.sortDirection,
  };
}
