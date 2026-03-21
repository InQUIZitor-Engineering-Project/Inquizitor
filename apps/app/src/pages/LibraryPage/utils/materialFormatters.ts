/**
 * Shared formatters and helpers for material display (grid + list view).
 */

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("pl-PL", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case "done":
      return "Gotowy";
    case "pending":
      return "Przetwarzanie";
    case "failed":
      return "Błąd";
    default:
      return status;
  }
}

export function getPageLabel(pageCount: number | null | undefined): string {
  if (!pageCount) return "";
  if (pageCount === 1) return "1 strona";
  if (pageCount <= 4) return `${pageCount} strony`;
  return `${pageCount} stron`;
}

/** Badge variant for status (aligned with design system Badge: success / warning / danger) */
export type StatusBadgeVariant = "success" | "warning" | "danger" | "neutral";

export function getStatusBadgeVariant(status: string): StatusBadgeVariant {
  switch (status) {
    case "done":
      return "success";
    case "pending":
      return "warning";
    case "failed":
      return "danger";
    default:
      return "neutral";
  }
}
