import React, { useEffect, useState, useRef } from "react";
import styled from "styled-components";
import { MathJax } from "better-react-mathjax"; 
import { type TestDetail, type QuestionOut, type PdfExportConfig } from "../../../services/test";

// --- STAŁE ---
const PAGE_HEIGHT_PX = 1123; 
const PAGE_PADDING_Y_PX = 150; 
const CONTENT_HEIGHT_PX = PAGE_HEIGHT_PX - PAGE_PADDING_Y_PX;
const PX_TO_CM = 37.8; 

// --- STYLES ---
const FONT_MAP: Record<string, string> = {
  roboto: "'Roboto', sans-serif",
  serif: "'Merriweather', serif",
};
const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
const BRAND_COLOR = "#4CAF4F"; 

const A4Page = styled.div<{ $fontKey: string }>`
  width: 210mm;
  height: 297mm;
  background: white;
  margin-bottom: 2rem;
  padding: 2cm;
  box-shadow: 0 4px 15px rgba(0,0,0,0.15);
  overflow: hidden;
  position: relative;
  box-sizing: border-box;
  font-family: ${props => FONT_MAP[props.$fontKey] || FONT_MAP['roboto']};
  font-size: 11pt;
  line-height: 1.4;
  color: #000;
  display: flex;
  flex-direction: column; 
`;

const MeasureContainer = styled.div`
  position: absolute; top: 0; left: 0; width: 210mm; visibility: hidden; pointer-events: none; z-index: -1000; padding: 2cm;
`;

const QuestionContainer = styled.div` margin-bottom: 15px; break-inside: avoid; `;
const QuestionBox = styled.div` background-color: ${hexToRgba(BRAND_COLOR, 0.05)}; border: 1px solid ${hexToRgba(BRAND_COLOR, 0.5)}; padding: 3mm; margin-bottom: 8px; `;
const QuestionText = styled.div` & p { margin: 0; } `;
const ChoicesGrid = styled.div<{ $cols: number }>` display: grid; grid-template-columns: repeat(${props => props.$cols}, 1fr); gap: 8px 16px; margin-left: 2em; margin-bottom: 10px; `;
const ChoiceItem = styled.div` display: flex; align-items: baseline; gap: 8px; `;
const ChoiceLabel = styled.span` font-weight: 700; min-width: 1.5em; `;
const AnswerGrid = styled.div<{ $heightCm: number }>` width: 100%; height: ${props => props.$heightCm}cm; border: 1px solid #ccc; background-size: 0.5cm 0.5cm; background-image: linear-gradient(to right, #e5e5e5 1px, transparent 1px), linear-gradient(to bottom, #e5e5e5 1px, transparent 1px); margin-top: 5px; `;
const AnswerLines = styled.div<{ $heightCm: number }>` width: 100%; height: ${props => props.$heightCm}cm; border: 1px solid #ccc; background-size: 100% 0.9cm; background-image: linear-gradient(to bottom, transparent calc(0.9cm - 1px), #e5e5e5 calc(0.9cm - 1px)); position: relative; &::before { content: ''; position: absolute; left: 1.5cm; top: 0; bottom: 0; width: 2px; background-color: ${hexToRgba(BRAND_COLOR, 0.5)}; } `;
const AnswerBlank = styled.div<{ $heightCm: number }>` width: 100%; height: ${props => props.$heightCm}cm; `;
const Header = styled.div` display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; margin-bottom: 20px; min-height: 1.3cm; `;
const HeaderTitle = styled.h1` font-size: 14pt; font-weight: 700; color: ${BRAND_COLOR}; margin: 0; text-align: right; width: 100%; `;
const StudentBox = styled.div` border: 0.5pt solid #888; padding: 10px 15px; margin-bottom: 20px; display: flex; justify-content: space-between; font-size: 11pt; `;

// --- TYPES & COMPONENTS ---

interface PageLayout {
  questions: QuestionOut[];
  hasHeader: boolean;
  scratchpadHeightCm?: number; 
  isScratchpadOnly?: boolean;
  isAnswerKey?: boolean; // <--- NOWE POLE
}

interface LiveTestPreviewProps {
  data: TestDetail;
  config: PdfExportConfig;
}

const SingleQuestionBlock: React.FC<{ q: QuestionOut, idx: number, config: PdfExportConfig }> = ({ q, idx, config }) => {
    const getColumns = (choices: string[]) => {
        const totalLen = choices.join('').length;
        if (totalLen < 60) return 4;
        if (totalLen < 140) return 2;
        return 1;
    };
    const getLetter = (index: number) => String.fromCharCode(97 + index) + ")";

    return (
        <QuestionContainer id={`measure-q-${q.id}`}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ fontWeight: 'bold', minWidth: '20px' }}>{idx + 1}.</div>
              <div style={{ flex: 1 }}>
                 <QuestionBox>
                    <MathJax dynamic><QuestionText dangerouslySetInnerHTML={{ __html: q.text }} /></MathJax>
                 </QuestionBox>
                 {q.is_closed && q.choices && q.choices.length > 0 ? (
                   <ChoicesGrid $cols={getColumns(q.choices)}>
                     {q.choices.map((choice, cIdx) => (
                       <ChoiceItem key={cIdx}>
                         <ChoiceLabel>{getLetter(cIdx)}</ChoiceLabel>
                         <MathJax dynamic inline><span dangerouslySetInnerHTML={{ __html: choice }} /></MathJax>
                       </ChoiceItem>
                     ))}
                   </ChoicesGrid>
                 ) : null}
                 {!q.is_closed && (
                   <>
                     {config.answer_space_style === 'grid' && <AnswerGrid $heightCm={config.space_height_cm || 3} />}
                     {config.answer_space_style === 'lines' && <AnswerLines $heightCm={config.space_height_cm || 3} />}
                     {config.answer_space_style === 'blank' && <AnswerBlank $heightCm={config.space_height_cm || 3} />}
                   </>
                 )}
              </div>
            </div>
        </QuestionContainer>
    );
}

const LiveTestPreview: React.FC<LiveTestPreviewProps> = ({ data, config }) => {
  const [pages, setPages] = useState<PageLayout[]>([]);
  const measureRef = useRef<HTMLDivElement>(null);
  const currentFont = (config as any).font || 'roboto'; 

  useEffect(() => {
    const timeoutId = setTimeout(() => {
        if (!measureRef.current) return;

        const computedPages: PageLayout[] = [];
        let currentPageQuestions: QuestionOut[] = [];
        
        const headerEl = measureRef.current.querySelector('#page-header');
        const headerHeight = headerEl?.getBoundingClientRect().height || 0;
        
        let currentHeight = headerHeight; 

        // 1. Rozmieszczanie pytań
        data.questions.forEach((q) => {
            const qEl = measureRef.current?.querySelector(`#measure-q-${q.id}`);
            if (qEl) {
                const qHeight = qEl.getBoundingClientRect().height;
                if (currentHeight + qHeight > CONTENT_HEIGHT_PX) {
                    computedPages.push({
                        questions: currentPageQuestions,
                        hasHeader: computedPages.length === 0,
                    });
                    currentPageQuestions = [q];
                    currentHeight = qHeight;
                } else {
                    currentPageQuestions.push(q);
                    currentHeight += qHeight;
                }
            }
        });

        if (currentPageQuestions.length > 0) {
            computedPages.push({
                questions: currentPageQuestions,
                hasHeader: computedPages.length === 0,
            });
        }

        if (config.use_scratchpad) {
            const lastPage = computedPages[computedPages.length - 1];
            const remainingSpacePx = CONTENT_HEIGHT_PX - currentHeight;
            const halfPagePx = CONTENT_HEIGHT_PX * 0.5;
            const titleSpacePx = 60; 

            if (remainingSpacePx > halfPagePx) {
                const scratchpadHeightPx = remainingSpacePx - titleSpacePx - 20;
                lastPage.scratchpadHeightCm = Math.max(1, scratchpadHeightPx / PX_TO_CM);
            } else {
                computedPages.push({
                    questions: [],
                    hasHeader: false,
                    isScratchpadOnly: true,
                    scratchpadHeightCm: 23 
                });
            }
        }

        if (config.include_answer_key) {
            computedPages.push({
                questions: [],
                hasHeader: false,
                isAnswerKey: true
            });
        }

        setPages(computedPages);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [data, config]); 

  return (
    <>
        <MeasureContainer ref={measureRef}>
            <div id="page-header">
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
            {data.questions.map((q, idx) => (
                <SingleQuestionBlock key={q.id} q={q} idx={idx} config={config} />
            ))}
        </MeasureContainer>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {pages.map((page, pageIdx) => (
                <A4Page key={pageIdx} $fontKey={currentFont}>
                    
                    {page.isAnswerKey ? (
                        <>
                            <h3 style={{ color: BRAND_COLOR, marginTop: 0 }}>Klucz odpowiedzi</h3>
                            
                            <div style={{ columnCount: 4, columnGap: '1cm' }}>
                                <ol style={{ marginTop: 0, paddingLeft: '1.5em', margin: 0 }}>
                                    {data.questions.map((q, qIdx) => (
                                        <li key={q.id} style={{ marginBottom: '4px', breakInside: 'avoid' }}>
                                            {q.is_closed ? (
                                                <span style={{ fontWeight: 'bold', color: '#333' }}>
                                                     {(() => {
                                                         if (!q.choices || !q.correct_choices) return "-";
                                                         
                                                         const letters = q.correct_choices.map(correctTxt => {
                                                             const idx = q.choices?.findIndex(c => c === correctTxt) ?? 0;
                                                             return idx !== -1 ? String.fromCharCode(65 + idx) : "?";
                                                         });

                                                         return letters.length > 0 ? letters.sort().join(", ") : "-";
                                                     })()}
                                                </span>
                                            ) : (
                                                <span style={{ fontSize: '1em', color: '#333', fontWeight: 'bold' }}>otwarte</span>
                                            )}
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        </>
                    ) : (
                        <>
                            {page.hasHeader && (
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

                            <div style={{ counterReset: "question", flex: 1 }}>
                                {page.questions.map((q) => {
                                    const originalIdx = data.questions.findIndex(oq => oq.id === q.id);
                                    return (
                                        <SingleQuestionBlock 
                                            key={q.id} 
                                            q={q} 
                                            idx={originalIdx} 
                                            config={config} 
                                        />
                                    );
                                })}

                                {page.scratchpadHeightCm && (
                                    <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
                                        <h3 style={{ color: BRAND_COLOR, marginTop: 0 }}>Brudnopis</h3>
                                        <AnswerGrid $heightCm={page.scratchpadHeightCm} />
                                    </div>
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