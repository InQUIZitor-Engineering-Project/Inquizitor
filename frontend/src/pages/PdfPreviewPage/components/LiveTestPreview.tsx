import React, { useEffect } from "react";
import styled from "styled-components";
import { MathJax } from "better-react-mathjax"; // Importujemy komponent
import { type TestDetail, type PdfExportConfig } from "../../../services/test";

// --- MAPA CZCIONEK ---
// Możemy łatwo dodać więcej. Wystarczy załadować je z Google Fonts.
const FONT_MAP: Record<string, string> = {
  roboto: "'Roboto', sans-serif",
  serif: "'Merriweather', serif",     // Odpowiednik LaTeXowego Computer Modern / Times
  monospace: "'Inconsolata', monospace",
  dyslexic: "'OpenDyslexic', sans-serif" // Przykład inkluzywności
};

// Funkcja pomocnicza do kolorów
const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const BRAND_COLOR = "#4CAF4F"; 

// Dynamiczna czcionka w kontenerze
const PageContent = styled.div<{ $fontKey: string }>`
  font-family: ${props => FONT_MAP[props.$fontKey] || FONT_MAP['roboto']};
  color: #000;
  font-size: 11pt;
  line-height: 1.5; // Troszkę większy spacing dla lepszej czytelności podglądu
  padding: 0;
  
  /* Ważne: MathJax używa własnych fontów do wzorów, 
     ale tekst dookoła będzie w Twojej wybranej czcionce. */
`;

// Header (Logo + Tytuł)
const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #eee; // Opcjonalnie, LaTeX tego nie ma, ale ładnie wygląda
  padding-bottom: 10px;
  margin-bottom: 20px;
  min-height: 1.3cm;
`;

const HeaderTitle = styled.h1`
  font-size: 14pt;
  font-weight: 700;
  color: ${BRAND_COLOR};
  margin: 0;
  text-align: right;
  width: 100%;
`;

// Sekcja Studenta (Ramka)
const StudentBox = styled.div`
  border: 0.5pt solid #888; // gray!50
  padding: 10px 15px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  font-size: 11pt;
`;

// Pytanie - Box (tcolorbox)
const QuestionContainer = styled.div`
  margin-bottom: 15px;
  break-inside: avoid; // Unikanie łamania w środku pytania przy druku
`;

const QuestionBox = styled.div`
  background-color: ${hexToRgba(BRAND_COLOR, 0.05)}; // brand!5!white
  border: 1px solid ${hexToRgba(BRAND_COLOR, 0.5)}; // brand!50
  padding: 3mm; // left=3mm, right=3mm...
  margin-bottom: 8px;
  position: relative;
`;

const QuestionText = styled.div`
  font-weight: 400;
  
  /* Obsługa prostego HTML w treści pytania (jeśli masz rich text editor) */
  & p { margin: 0; }
`;

// Grid odpowiedzi (Tasks)
const ChoicesGrid = styled.div<{ $cols: number }>`
  display: grid;
  grid-template-columns: repeat(${props => props.$cols}, 1fr);
  gap: 8px 16px;
  margin-left: 2em; // item-indent
  margin-bottom: 10px;
`;

const ChoiceItem = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;
`;

const ChoiceLabel = styled.span`
  font-weight: 700; // label-format=\bfseries
  min-width: 1.5em;
`;

const AnswerGrid = styled.div<{ $heightCm: number }>`
  width: 100%;
  height: ${props => props.$heightCm}cm;
  border: 1px solid #ccc; // gray!30
  background-size: 0.5cm 0.5cm;
  background-image: 
    linear-gradient(to right, #e5e5e5 1px, transparent 1px),
    linear-gradient(to bottom, #e5e5e5 1px, transparent 1px);
  margin-top: 5px;
`;

const TypeLabel = styled.div<{ $isMulti?: boolean }>`
  text-align: right;
  font-family: sans-serif;
  font-size: 8pt;
  font-weight: 700;
  text-transform: uppercase;
  color: ${props => props.$isMulti ? BRAND_COLOR : '#555'};
  margin-bottom: 2px;
`;

// Lines (Linie)
const AnswerLines = styled.div<{ $heightCm: number }>`
  width: 100%;
  height: ${props => props.$heightCm}cm;
  border: 1px solid #ccc;
  background-size: 100% 0.9cm; // LaTeX domyślnie robi linie co ok 0.9cm w answerlines
  background-image: 
    linear-gradient(to bottom, transparent calc(0.9cm - 1px), #e5e5e5 calc(0.9cm - 1px));
  position: relative;

  /* Margines pionowy po lewej (styl brandowy z LaTeXa) */
  &::before {
    content: '';
    position: absolute;
    left: 1.5cm;
    top: 0;
    bottom: 0;
    width: 2px;
    background-color: ${hexToRgba(BRAND_COLOR, 0.5)};
  }
`;

// Blank (Puste miejsce)
const AnswerBlank = styled.div<{ $heightCm: number }>`
  width: 100%;
  height: ${props => props.$heightCm}cm;
  /* border: 1px dashed #eee; // Opcjonalnie, żeby było widać ile miejsca zajmuje */
`;


interface LiveTestPreviewProps {
  data: TestDetail;
  config: PdfExportConfig;
}

const LiveTestPreview: React.FC<LiveTestPreviewProps> = ({ data, config }) => {
  
  useEffect(() => {
    const link = document.createElement('link');
    link.href = "https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&family=Roboto:wght@300;400;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  const getColumns = (choices: string[]) => {
    const totalLen = choices.join('').length;
    if (totalLen < 60) return 4;
    if (totalLen < 140) return 2;
    return 1;
  };
  const getLetter = (index: number) => String.fromCharCode(97 + index) + ")";

  const currentFont = (config as any).font || 'roboto'; 

  return (
    <PageContent $fontKey={currentFont}>
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

      <div style={{ counterReset: "question" }}>
        {data.questions.map((q, idx) => (
          <QuestionContainer key={q.id}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ fontWeight: 'bold', minWidth: '20px' }}>{idx + 1}.</div>
              <div style={{ flex: 1 }}>

                  {config.mark_multi_choice && q.is_closed && (
                   <TypeLabel $isMulti={(q.correct_choices?.length ?? 0) > 2 }>
                     {(q.correct_choices?.length ?? 0) > 2 ? "[WIELOKROTNY WYBÓR]" : "[JEDNOKROTNY WYBÓR]"}
                   </TypeLabel>
                  )}
                 
                 <QuestionBox>
                    {/* ZMIANA: MathJax renderuje HTML z matematyką */}
                    <MathJax dynamic>
                        <QuestionText dangerouslySetInnerHTML={{ __html: q.text }} />
                    </MathJax>
                 </QuestionBox>

                 {q.is_closed && q.choices && q.choices.length > 0 ? (
                   <ChoicesGrid $cols={getColumns(q.choices)}>
                     {q.choices.map((choice, cIdx) => (
                       <ChoiceItem key={cIdx}>
                         <ChoiceLabel>{getLetter(cIdx)}</ChoiceLabel>
                         
                         {/* ZMIANA: MathJax w odpowiedziach */}
                         <MathJax dynamic inline>
                            <span dangerouslySetInnerHTML={{ __html: choice }} />
                         </MathJax>
                         
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
        ))}
      </div>
      
      {config.use_scratchpad && (
        <div style={{ marginTop: '30px', borderTop: '2px dashed #ccc', paddingTop: '20px' }}>
          <h3 style={{ color: BRAND_COLOR, margin: '0 0 10px 0' }}>Brudnopis</h3>
          {/* Uproszczony brudnopis - w PDF jest dynamiczny, tu dajemy stały podgląd */}
          <AnswerGrid $heightCm={10} />
        </div>
      )}

      {/* KLUCZ ODPOWIEDZI */}
      {config.include_answer_key && (
         <div style={{ marginTop: '40px', pageBreakBefore: 'always' }}>
            <h3 style={{ color: BRAND_COLOR }}>Klucz odpowiedzi</h3>
            <ol>
              {data.questions.map((q) => (
                 <li key={q.id} style={{ marginBottom: '5px' }}>
                    {q.is_closed ? (
                      // Tu zakładam, że masz pole correct_choices w danych, jeśli nie - ukryj
                      // W PDF masz q.correct_choices
                      <span style={{ fontWeight: 'bold' }}>
                         {/* Placeholder - w zależności od struktury danych */}
                         (Poprawna odpowiedź)
                      </span>
                    ) : (
                      <i>otwarte</i>
                    )}
                 </li>
              ))}
            </ol>
         </div>
      )}

    </PageContent>
  );
};

export default LiveTestPreview;