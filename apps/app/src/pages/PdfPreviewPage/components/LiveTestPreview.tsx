import React, { useEffect, useState, useRef } from "react";
import styled from "styled-components";
import { MathText } from "../../../components/MathText/MathText";
import { type TestDetail, type QuestionOut, type PdfExportConfig } from "../../../services/test";

// --- STAŁE ---
const PAGE_HEIGHT_PX = 1123;
const PAGE_PADDING_Y_PX = 150;
const CONTENT_HEIGHT_PX = PAGE_HEIGHT_PX - PAGE_PADDING_Y_PX;
const PX_TO_CM = 37.8;

// --- STYLE ---
const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
const BRAND_COLOR = "#4CAF4F";

const PREVIEW_TYPOGRAPHY = `
  font-family: 'Roboto', sans-serif;
  font-size: 11pt;
  line-height: 1.2;
  color: #000;
`;

const A4Page = styled.div`
  width: 210mm;
  height: 297mm;
  background: white;
  margin-bottom: 2rem;
  padding: 2cm;
  box-shadow: 0 4px 15px rgba(0,0,0,0.15);
  overflow: hidden;
  position: relative;
  box-sizing: border-box;
  ${PREVIEW_TYPOGRAPHY}
  display: flex;
  flex-direction: column;
`;

// Typografia musi być identyczna z A4Page — inaczej pomiary są przeszacowane
const MeasureContainer = styled.div`
  position: absolute; top: 0; left: 0; width: 210mm; visibility: hidden; pointer-events: none; z-index: -1000; padding: 2cm;
  ${PREVIEW_TYPOGRAPHY}
`;

const QuestionContainer = styled.div` margin-bottom: 15px; break-inside: avoid; `;
// padding zgodny z LaTeX questionbox: left=3mm right=3mm top=2mm bottom=2mm
const QuestionBox = styled.div` background-color: ${hexToRgba(BRAND_COLOR, 0.05)}; border: 1px solid ${hexToRgba(BRAND_COLOR, 0.5)}; padding: 2mm 3mm; margin-bottom: 8px; `;
const QuestionText = styled.div` & p { margin: 0; } `;
const MultiChoiceLabel = styled.div<{ $isMulti: boolean }>` text-align: right; font-size: 8pt; font-weight: 700; font-family: sans-serif; color: ${({ $isMulti }) => $isMulti ? BRAND_COLOR : '#555'}; margin-bottom: 1px; `;
// margin-top: 7px odpowiada tasks before-skip=0.5em przy 11pt
const ChoicesGrid = styled.div<{ $cols: number }>` display: grid; grid-template-columns: repeat(${props => props.$cols}, 1fr); gap: 8px 16px; margin-left: 2em; margin-top: 7px; margin-bottom: 10px; `;
const ChoiceItem = styled.div` display: flex; align-items: baseline; gap: 8px; `;
const ChoiceLabel = styled.span` font-weight: 700; min-width: 1.5em; `;
const AnswerGrid = styled.div<{ $heightCm: number }>` width: 100%; height: ${props => props.$heightCm}cm; border: 1px solid #ccc; background-size: 0.5cm 0.5cm; background-image: linear-gradient(to right, #e5e5e5 1px, transparent 1px), linear-gradient(to bottom, #e5e5e5 1px, transparent 1px); margin-top: 5px; `;
const AnswerLines = styled.div<{ $heightCm: number }>` width: 100%; height: ${props => props.$heightCm}cm; border: 1px solid #ccc; background-size: 100% 0.9cm; background-image: linear-gradient(to bottom, transparent calc(0.9cm - 1px), #e5e5e5 calc(0.9cm - 1px)); position: relative; &::before { content: ''; position: absolute; left: 1.5cm; top: 0; bottom: 0; width: 2px; background-color: ${hexToRgba(BRAND_COLOR, 0.5)}; } `;
const AnswerBlank = styled.div<{ $heightCm: number }>` width: 100%; height: ${props => props.$heightCm}cm; `;
const Header = styled.div` display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; margin-bottom: 20px; min-height: 1.3cm; `;
const HeaderTitle = styled.h1` font-size: 14pt; font-weight: 700; color: ${BRAND_COLOR}; margin: 0; text-align: right; width: 100%; `;
const StudentBox = styled.div` border: 0.5pt solid #888; padding: 10px 15px; margin-bottom: 20px; display: flex; justify-content: space-between; font-size: 11pt; `;
const VariantTitle = styled.h2` font-size: 13pt; font-weight: 700; color: ${BRAND_COLOR}; margin: 0 0 14px 0; padding: 0; `;

// --- TYPY ---
interface Variant {
  id: number | null;
  name: string;
  questions: QuestionOut[];
}

interface PageLayout {
  questions: QuestionOut[];
  hasDocHeader: boolean;
  variantName?: string;
  questionStartIdx: number;
  scratchpadHeightCm?: number;
  isScratchpadOnly?: boolean;
  isAnswerKey?: boolean;
}

interface LiveTestPreviewProps {
  data: TestDetail;
  config: PdfExportConfig;
}

// --- HELPERY ---
function buildVariants(data: TestDetail): Variant[] {
  if (data.groups && data.groups.length > 0) {
    const sorted = [...data.groups].sort(
      (a, b) => a.position - b.position || a.id - b.id
    );
    return sorted.map(g => ({
      id: g.id,
      name: g.label,
      questions: data.questions.filter(q => q.group_id === g.id),
    }));
  }
  return [{ id: null, name: "", questions: data.questions }];
}

function variantKey(v: Variant): string {
  return v.id != null ? String(v.id) : "default";
}

// --- BLOK PYTANIA ---
const SingleQuestionBlock: React.FC<{
  q: QuestionOut;
  questionNumber: number;
  config: PdfExportConfig;
}> = ({ q, questionNumber, config }) => {
  const getColumns = (choices: string[]) => {
    const totalLen = choices.join("").length;
    if (totalLen < 60) return 4;
    if (totalLen < 140) return 2;
    return 1;
  };
  const getLetter = (index: number) => String.fromCharCode(97 + index) + ")";
  const isMulti = Boolean(q.is_closed && q.correct_choices && q.correct_choices.length > 1);

  return (
    <QuestionContainer id={`measure-q-${q.id}`}>
      <div style={{ display: "flex", gap: "8px" }}>
        <div style={{ fontWeight: "bold", minWidth: "20px" }}>{questionNumber}.</div>
        <div style={{ flex: 1 }}>
          {config.mark_multi_choice && q.is_closed && (
            <MultiChoiceLabel $isMulti={isMulti}>
              {isMulti ? "[WIELOKROTNY WYBÓR]" : "[JEDNOKROTNY WYBÓR]"}
            </MultiChoiceLabel>
          )}
          <QuestionBox>
            <QuestionText>
              <MathText text={q.text} />
            </QuestionText>
          </QuestionBox>
          {q.is_closed && q.choices && q.choices.length > 0 ? (
            <ChoicesGrid $cols={getColumns(q.choices)}>
              {q.choices.map((choice, cIdx) => (
                <ChoiceItem key={cIdx}>
                  <ChoiceLabel>{getLetter(cIdx)}</ChoiceLabel>
                  <MathText text={choice} />
                </ChoiceItem>
              ))}
            </ChoicesGrid>
          ) : null}
          {!q.is_closed && (
            <>
              {config.answer_space_style === "grid" && <AnswerGrid $heightCm={config.space_height_cm || 3} />}
              {config.answer_space_style === "lines" && <AnswerLines $heightCm={config.space_height_cm || 3} />}
              {config.answer_space_style === "blank" && <AnswerBlank $heightCm={config.space_height_cm || 3} />}
            </>
          )}
        </div>
      </div>
    </QuestionContainer>
  );
};

// --- GŁÓWNY KOMPONENT ---
const LiveTestPreview: React.FC<LiveTestPreviewProps> = ({ data, config }) => {
  const [pages, setPages] = useState<PageLayout[]>([]);
  const measureRef = useRef<HTMLDivElement>(null);

  const variants = buildVariants(data);
  const showVariantHeader = variants.length > 1 || !!variants[0]?.name;

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!measureRef.current) return;

      const containerEl = measureRef.current;

      // Wysokość głównego nagłówka (tytuł + box studenta)
      // overflow:hidden na elemencie zapobiega uciecze marginesów
      const pageHeaderEl = containerEl.querySelector("#measure-page-header");
      const mainHeaderHeight = pageHeaderEl?.getBoundingClientRect().height || 0;

      // Wysokości nagłówków wariantów (sekcji grup)
      const variantHeaderHeights: Record<string, number> = {};
      variants.forEach(v => {
        const el = containerEl.querySelector(`#measure-vh-${variantKey(v)}`);
        variantHeaderHeights[variantKey(v)] = el?.getBoundingClientRect().height || 0;
      });

      // Mapa elementów pytań (renderowane w kolejności wariantów)
      const questionElMap: Record<number, Element | null> = {};
      data.questions.forEach(q => {
        questionElMap[q.id] = containerEl.querySelector(`#measure-q-${q.id}`);
      });

      const computedPages: PageLayout[] = [];

      variants.forEach((variant, variantIdx) => {
        const vKey = variantKey(variant);
        const varHeaderH = showVariantHeader ? (variantHeaderHeights[vKey] || 0) : 0;
        const questions = variant.questions;

        let currentPageQuestions: QuestionOut[] = [];
        let isFirstPageOfVariant = true;
        let questionStartIdx = 1;
        let currentHeight = variantIdx === 0
          ? mainHeaderHeight + varHeaderH
          : varHeaderH;

        questions.forEach((q, qIdx) => {
          const qEl = questionElMap[q.id];
          if (!qEl) return;

          // Mierzymy odległość do kolejnego pytania z TEGO SAMEGO wariantu
          // żeby margines był poprawnie uwzględniony
          const nextQ = questions[qIdx + 1];
          const nextEl = nextQ ? questionElMap[nextQ.id] : null;
          const qHeight = nextEl
            ? nextEl.getBoundingClientRect().top - qEl.getBoundingClientRect().top
            : qEl.getBoundingClientRect().height + 15;

          if (currentHeight + qHeight > CONTENT_HEIGHT_PX) {
            computedPages.push({
              questions: currentPageQuestions,
              hasDocHeader: variantIdx === 0 && isFirstPageOfVariant,
              variantName: isFirstPageOfVariant && showVariantHeader
                ? (variant.name || "Pytania")
                : undefined,
              questionStartIdx,
            });
            questionStartIdx += currentPageQuestions.length;
            currentPageQuestions = [q];
            currentHeight = qHeight;
            isFirstPageOfVariant = false;
          } else {
            currentPageQuestions.push(q);
            currentHeight += qHeight;
          }
        });

        // Ostatnia strona wariantu (+ ewentualny brudnopis)
        let scratchpadHeightCm: number | undefined;
        let addScratchpadPage = false;

        if (config.use_scratchpad) {
          const remainingPx = CONTENT_HEIGHT_PX - currentHeight;
          const halfPagePx = CONTENT_HEIGHT_PX * 0.5;
          const titleSpacePx = 60;

          if (remainingPx > halfPagePx) {
            scratchpadHeightCm = Math.max(1, (remainingPx - titleSpacePx - 20) / PX_TO_CM);
          } else {
            addScratchpadPage = true;
          }
        }

        computedPages.push({
          questions: currentPageQuestions,
          hasDocHeader: variantIdx === 0 && isFirstPageOfVariant,
          variantName: isFirstPageOfVariant && showVariantHeader
            ? (variant.name || "Pytania")
            : undefined,
          questionStartIdx,
          scratchpadHeightCm,
        });

        if (addScratchpadPage) {
          computedPages.push({
            questions: [],
            hasDocHeader: false,
            questionStartIdx: 1,
            isScratchpadOnly: true,
            scratchpadHeightCm: 23,
          });
        }
      });

      if (config.include_answer_key) {
        computedPages.push({
          questions: [],
          hasDocHeader: false,
          questionStartIdx: 1,
          isAnswerKey: true,
        });
      }

      setPages(computedPages);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [data, config]);

  return (
    <>
      {/* Kontener pomiarowy — niewidoczny, renderuje wszystkie elementy do mierzenia */}
      <MeasureContainer ref={measureRef}>
        <div id="measure-page-header" style={{ overflow: "hidden" }}>
          <Header>
            <div />
            <HeaderTitle>{data.title}</HeaderTitle>
          </Header>
          {config.student_header && (
            <StudentBox>
              <span>Imię i nazwisko: ...</span>
            </StudentBox>
          )}
        </div>

        {variants.map(v => (
          <div key={variantKey(v)} id={`measure-vh-${variantKey(v)}`} style={{ overflow: "hidden" }}>
            {showVariantHeader && (
              <VariantTitle>{v.name || "Pytania"}</VariantTitle>
            )}
          </div>
        ))}

        {/* Pytania renderowane w kolejności wariantów — ważne dla pomiaru top-diff */}
        {variants.flatMap(v =>
          v.questions.map((q, qIdx) => (
            <SingleQuestionBlock
              key={q.id}
              q={q}
              questionNumber={qIdx + 1}
              config={config}
            />
          ))
        )}
      </MeasureContainer>

      {/* Widoczne strony */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        {pages.map((page, pageIdx) => (
          <A4Page key={pageIdx}>
            {page.isAnswerKey ? (
              <>
                <h3 style={{ color: BRAND_COLOR, marginTop: 0 }}>Klucz odpowiedzi</h3>
                {variants.map((variant, vIdx) => (
                  <div key={variantKey(variant)}>
                    {variants.length > 1 && (
                      <h4 style={{ color: "#333", margin: "8px 0 4px" }}>{variant.name}</h4>
                    )}
                    <div style={{
                      columnCount: Math.min(4, Math.ceil(variant.questions.length / 5)) || 1,
                      columnGap: "1cm",
                      marginBottom: vIdx < variants.length - 1 ? "16px" : 0,
                    }}>
                      <ol style={{ marginTop: 0, paddingLeft: "1.5em", margin: 0 }}>
                        {variant.questions.map(q => (
                          <li key={q.id} style={{ marginBottom: "4px", breakInside: "avoid" }}>
                            {q.is_closed ? (
                              <span style={{ fontWeight: "bold", color: "#333" }}>
                                {(() => {
                                  if (!q.choices || !q.correct_choices) return "-";
                                  const letters = q.correct_choices.map(correctTxt => {
                                    const idx = q.choices?.findIndex(c => c === correctTxt) ?? -1;
                                    return idx !== -1 ? String.fromCharCode(65 + idx) : "?";
                                  });
                                  return letters.length > 0 ? letters.sort().join(", ") : "-";
                                })()}
                              </span>
                            ) : (
                              <span style={{ fontSize: "1em", color: "#333", fontWeight: "bold" }}>otwarte</span>
                            )}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <>
                {page.hasDocHeader && (
                  <>
                    <Header>
                      <div />
                      <HeaderTitle>{data.title}</HeaderTitle>
                    </Header>
                    {config.student_header && (
                      <StudentBox>
                        <span><strong>Imię i nazwisko:</strong> ......................................................</span>
                        <span><strong>Klasa/Grupa:</strong> ........................</span>
                      </StudentBox>
                    )}
                  </>
                )}

                {page.variantName !== undefined && (
                  <VariantTitle>{page.variantName}</VariantTitle>
                )}

                <div style={{ flex: 1 }}>
                  {page.questions.map((q, qIdx) => (
                    <SingleQuestionBlock
                      key={q.id}
                      q={q}
                      questionNumber={page.questionStartIdx + qIdx}
                      config={config}
                    />
                  ))}

                  {page.scratchpadHeightCm && (
                    <div style={{ marginTop: "auto", paddingTop: "20px" }}>
                      <h3 style={{ color: BRAND_COLOR, marginTop: 0 }}>Brudnopis</h3>
                      <AnswerGrid $heightCm={page.scratchpadHeightCm} />
                    </div>
                  )}

                  {page.isScratchpadOnly && page.scratchpadHeightCm && (
                    <>
                      <h3 style={{ color: BRAND_COLOR, marginTop: 0 }}>Brudnopis</h3>
                      <AnswerGrid $heightCm={page.scratchpadHeightCm} />
                    </>
                  )}
                </div>
              </>
            )}
          </A4Page>
        ))}
      </div>
    </>
  );
};

export default LiveTestPreview;
