/** Lucide-style inline SVGs (replace with lucide-react when added) */
import React from "react";

const iconProps = {
  width: 18,
  height: 18,
  strokeWidth: 2,
  stroke: "currentColor",
  fill: "none",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const SearchIcon: React.FC<React.SVGAttributes<SVGElement>> = (p) => (
  <svg {...iconProps} {...p} viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

export const LayoutGridIcon: React.FC<React.SVGAttributes<SVGElement>> = (p) => (
  <svg {...iconProps} {...p} viewBox="0 0 24 24">
    <rect width="7" height="7" x="3" y="3" rx="1" />
    <rect width="7" height="7" x="14" y="3" rx="1" />
    <rect width="7" height="7" x="3" y="14" rx="1" />
    <rect width="7" height="7" x="14" y="14" rx="1" />
  </svg>
);

export const ListIcon: React.FC<React.SVGAttributes<SVGElement>> = (p) => (
  <svg {...iconProps} {...p} viewBox="0 0 24 24">
    <line x1="8" x2="21" y1="6" y2="6" />
    <line x1="8" x2="21" y1="12" y2="12" />
    <line x1="8" x2="21" y1="18" y2="18" />
    <line x1="3" x2="3.01" y1="6" y2="6" />
    <line x1="3" x2="3.01" y1="12" y2="12" />
    <line x1="3" x2="3.01" y1="18" y2="18" />
  </svg>
);

export const DownloadIcon: React.FC<React.SVGAttributes<SVGElement>> = (p) => (
  <svg {...iconProps} {...p} viewBox="0 0 24 24">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" x2="12" y1="15" y2="3" />
  </svg>
);

export const TrashIcon: React.FC<React.SVGAttributes<SVGElement>> = (p) => (
  <svg {...iconProps} {...p} viewBox="0 0 24 24">
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    <line x1="10" x2="10" y1="11" y2="17" />
    <line x1="14" x2="14" y1="11" y2="17" />
  </svg>
);

export const FolderInputIcon: React.FC<React.SVGAttributes<SVGElement>> = (p) => (
  <svg {...iconProps} {...p} viewBox="0 0 24 24">
    <path d="M2 9V5a2 2 0 0 1 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2" />
    <path d="M2 13h10" />
    <path d="m9 16 3-3-3-3" />
  </svg>
);

export const XIcon: React.FC<React.SVGAttributes<SVGElement>> = (p) => (
  <svg {...iconProps} {...p} viewBox="0 0 24 24">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

/** Clipboard / test / quiz – „Użyj do testu” */
export const TestIcon: React.FC<React.SVGAttributes<SVGElement>> = (p) => (
  <svg {...iconProps} {...p} viewBox="0 0 24 24">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
    <path d="M9 14h6" />
    <path d="M9 18h6" />
    <path d="M9 10h.01" />
  </svg>
);
