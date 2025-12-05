import React from "react";
import "katex/dist/katex.min.css";
import katex from "katex";

type Chunk =
  | { type: "text"; content: string }
  | { type: "math-inline"; content: string }
  | { type: "math-block"; content: string };

// Non-global regexes – we rely on capturing group [1] for inner math content.
const INLINE_RE = /\$(?!\$)([^$]+)\$(?!\$)/;
const BLOCK_RE = /\$\$([^$]+)\$\$/;

function splitIntoChunks(input: string): Chunk[] {
  if (!input.includes("$")) {
    return [{ type: "text", content: input }];
  }

  const chunks: Chunk[] = [];
  let rest = input;

  while (rest.includes("$")) {
    const blockIndex = rest.search(BLOCK_RE);
    const inlineIndex = rest.search(INLINE_RE);

    // No more math fragments
    if (blockIndex === -1 && inlineIndex === -1) break;

    const useBlock =
      blockIndex !== -1 &&
      (inlineIndex === -1 || blockIndex <= inlineIndex);

    if (useBlock && blockIndex !== -1) {
      const match = rest.match(BLOCK_RE);
      if (!match) break;

      const full = match[0] ?? "";
      const inner = match[1] ?? "";

      const before = rest.slice(0, blockIndex);
      if (before) chunks.push({ type: "text", content: before });

      chunks.push({ type: "math-block", content: inner.trim() });
      rest = rest.slice(blockIndex + full.length);
    } else if (!useBlock && inlineIndex !== -1) {
      const match = rest.match(INLINE_RE);
      if (!match) break;

      const full = match[0] ?? "";
      const inner = match[1] ?? "";

      const before = rest.slice(0, inlineIndex);
      if (before) chunks.push({ type: "text", content: before });

      chunks.push({ type: "math-inline", content: inner.trim() });
      rest = rest.slice(inlineIndex + full.length);
    } else {
      break;
    }
  }

  if (rest) {
    chunks.push({ type: "text", content: rest });
  }

  return chunks;
}

interface MathTextProps {
  text: string | null | undefined;
  asBlock?: boolean;
  className?: string;
}

export const MathText: React.FC<MathTextProps> = ({
  text,
  asBlock = false,
  className,
}) => {
  const safe = (text ?? "").toString();
  const chunks = splitIntoChunks(safe);

  if (chunks.length === 1 && chunks[0].type === "text" && !asBlock) {
    return <span className={className}>{chunks[0].content}</span>;
  }

  return (
    <span className={className}>
      {chunks.map((chunk, idx) => {
        if (chunk.type === "text") {
          return <span key={idx}>{chunk.content}</span>;
        }

        const displayMode = chunk.type === "math-block" || asBlock;
        try {
          const html = katex.renderToString(chunk.content, {
            throwOnError: false,
            displayMode,
          });
          return (
            <span
              key={idx}
              dangerouslySetInnerHTML={{ __html: html }}
              style={displayMode ? { display: "block", margin: "4px 0" } : {}}
            />
          );
        } catch {
          // On rendering error, fall back to the raw text wrapped in $...$
          const wrapper = displayMode ? "$$" : "$";
          return (
            <span key={idx}>
              {wrapper}
              {chunk.content}
              {wrapper}
            </span>
          );
        }
      })}
    </span>
  );
};

export default MathText;


