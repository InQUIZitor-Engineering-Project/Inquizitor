import React, { useRef, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { generateTest } from "../../services/test";
import { uploadMaterial, type MaterialUploadResponse } from "../../services/materials";
import Footer from "../../components/Footer/Footer";
import { useLoader } from "../../components/Loader/GlobalLoader";
import useDocumentTitle from "../../components/GeneralComponents/Hooks/useDocumentTitle";
import type { TestGenerateResponse } from "../../services/test";


import {
  CreateTestWrapper,
  ContentWrapper,
  InnerWrapper,
  Heading,
  Subheading,
  ToggleGroup,
  TextArea,
  GenerateButton,
  UploadSection,
  UploadButton,
  UploadInfo,
  UploadError,
  HiddenFileInput,
  SectionCard,
  SectionHeader,
  LabelRow,
  Hint,
  ErrorText,
  HelpRow,
  FieldsGrid,
  Field,
  Counter,
  SmallNote,
  StatPill,
  SectionRight,
  Divider, 
  DistributionBar, 
  DistributionSegment,
  PALETTE,
  Pill,
} from "./CreateTestPage.styles";

type LayoutCtx = { refreshSidebarTests: () => Promise<void> };


const CreateTestPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshSidebarTests } = useOutletContext<LayoutCtx>();

  const { withLoader } = useLoader();

  const [sourceType, setSourceType] = useState<"text" | "material">("text");
  const [sourceContent, setSourceContent] = useState("");
  const [tfCount, setTfCount] = useState(0);
  const [singleCount, setSingleCount] = useState(0);
  const [multiCount, setMultiCount] = useState(0);
  const [openCount, setOpenCount] = useState(0);  
  const [easyCount, setEasyCount] = useState(0);
  const [mediumCount, setMediumCount] = useState(0);
  const [hardCount, setHardCount] = useState(0);

  const [genError, setGenError] = useState<string | null>(null);
  const [genLoading, setGenLoading] = useState(false);

  const [materialData, setMaterialData] = useState<MaterialUploadResponse | null>(null);
  const [materialUploading, setMaterialUploading] = useState(false);
  const [materialError, setMaterialError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleMaterialButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleMaterialChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setMaterialError(null);
    setMaterialUploading(true);
    try {
      const uploaded = await uploadMaterial(file);
      if (uploaded.processing_status === "done") {
        setMaterialData(uploaded);
        setGenError(null);
        if (uploaded.extracted_text) {
          setSourceContent(uploaded.extracted_text);
        }
      } else {
        setMaterialData(null);
        setMaterialError(
          uploaded.processing_error || "Nie udało się wyodrębnić tekstu z pliku.",
        );
      }
    } catch (error: any) {
      setMaterialData(null);
      setMaterialError(error.message || "Nie udało się wgrać materiału.");
    } finally {
      setMaterialUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleGenerate = async () => {
    setGenError(null);
    setGenLoading(true);

    const totalClosed = tfCount + singleCount + multiCount;
    const totalAll = totalClosed + openCount;
    const hasStructure = totalAll > 0;

    const totalDifficulty = easyCount + mediumCount + hardCount;
    const difficultyMismatch = hasStructure && (totalDifficulty !== totalAll);

    const textPayload = sourceContent.trim();

  if (!textPayload) {
    setGenError("Uzupełnij treść źródłową (wklej tekst lub wgraj materiał).");
    setGenLoading(false);
    return;
  }

  if (!hasStructure) {
    setGenError("Ustaw najpierw strukturę pytań (ile TF / jednokrotnego / wielokrotnego / otwartych).");
    setGenLoading(false);
    return;
  }

  if (totalAll <= 0) {
    setGenError("Podaj łączną liczbę pytań (co najmniej jedno).");
    setGenLoading(false);
    return;
  }

  if (totalDifficulty === 0) {
    setGenError("Rozdziel pytania na poziomy trudności (łatwe/średnie/trudne).");
    setGenLoading(false);
    return;
  }

  if (difficultyMismatch) {
    setGenError(`Rozkład trudności (suma: ${totalDifficulty}) musi równać się liczbie pytań (razem: ${totalAll}).`);
    setGenLoading(false);
    return;
  }

  if (sourceType === "material" && !materialData?.file_id) {
    setGenError("Najpierw wgraj materiał dydaktyczny (plik).");
    setGenLoading(false);
    return;
  }

    try {
      const resp = await withLoader(() =>
        generateTest({
          closed: {
            true_false: tfCount,
            single_choice: singleCount,
            multi_choice: multiCount,
          },
          num_open: openCount,
          easy: easyCount,
          medium: mediumCount,
          hard: hardCount,
          text: textPayload || undefined,
          file_id: sourceType === "material" ? materialData?.file_id : undefined,
        })
      ) as TestGenerateResponse;

      await refreshSidebarTests();
      navigate(`/tests/${resp.test_id}`);
    } catch (err: any) {
      setGenError(err.message || "Wystąpił błąd przy generowaniu testu. Spróbuj ponownie.");
    } finally {
      setGenLoading(false);
    }
    };

  useDocumentTitle("Stwórz nowy | Inquizitor");
  const totalClosed = tfCount + singleCount + multiCount;
  const totalAll = totalClosed + openCount;

  const totalDifficulty = easyCount + mediumCount + hardCount;

  const hasStructure = totalAll > 0;
  const difficultyLocked = !hasStructure;

  const pct = (n: number, t: number) =>
    t > 0 ? Math.max(0, Math.min(100, Math.round((n / t) * 100))) : 0;

  const easyPct = pct(easyCount, totalDifficulty);
  const medPct  = pct(mediumCount, totalDifficulty);
  const hardPct = pct(hardCount, totalDifficulty);

  const difficultyMismatch = hasStructure && (totalDifficulty !== totalAll);

  return (
    <CreateTestWrapper>
      {/* USUNIĘTO <SIDEBAR> Z TEGO MIEJSCA */}
      
      <ContentWrapper>
        <InnerWrapper>
          <Heading>Utwórz test dopasowany do swoich potrzeb</Heading>
          <Subheading>
            Wgraj materiał lub wklej treść, wybierz typ pytań oraz poziom trudności,
            a my wygenerujemy gotowy test.
          </Subheading>

          {/* Źródło treści */}
          <SectionCard>
            <SectionHeader>
              <div>
                <h3>Źródło treści</h3>
                <Hint>Wybierz, skąd mamy pobrać materiał do wygenerowania pytań.</Hint>
              </div>
            </SectionHeader>

            <ToggleGroup>
              <button
                className={sourceType === "text" ? "active" : ""}
                onClick={() => setSourceType("text")}
              >
                Własny tekst
              </button>
              <button
                className={sourceType === "material" ? "active" : ""}
                onClick={() => setSourceType("material")}
              >
                Materiał dydaktyczny (plik)
              </button>
            </ToggleGroup>

            {sourceType === "material" && (
              <UploadSection>
                <HiddenFileInput
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt,.md,.png,.jpg"
                  onChange={handleMaterialChange}
                />

                <UploadButton
                  type="button"
                  onClick={handleMaterialButtonClick}
                  disabled={materialUploading}
                >
                  {materialUploading ? "Wgrywam…" : "Wgraj plik"}
                </UploadButton>

                {materialData && materialData.processing_status === "done" && (
                  <UploadInfo>
                    Tekst z pliku "{materialData.filename}" został dodany do formularza.
                  </UploadInfo>
                )}

                {materialError && <UploadError>{materialError}</UploadError>}
              </UploadSection>
            )}

            <LabelRow>
              <label>Treść źródłowa</label>
              <span>{sourceContent.trim().length} znaków</span>
            </LabelRow>
            <TextArea
              value={sourceContent}
              onChange={(e) => setSourceContent(e.target.value)}
              placeholder="Wklej treść materiału, notatki z zajęć, fragment podręcznika lub tekst, na podstawie którego chcesz wygenerować test..."
            />
          </SectionCard>

          {/* Typ pytań */}
          <SectionCard>
          <SectionHeader>
            <div>
              <h3>Struktura pytań</h3>
              <Hint>Najpierw ustaw liczbę pytań każdego rodzaju.</Hint>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Pill $bg={PALETTE.type.closedBg} $fg={PALETTE.type.closedFg}>
                Zamknięte: {totalClosed}
              </Pill>
              <Pill $bg={PALETTE.type.openBg} $fg={PALETTE.type.openFg}>
                Otwarte: {openCount}
              </Pill>
              <Pill $bg={PALETTE.total.bg} $fg={PALETTE.total.fg}>
                Razem: {totalAll}
              </Pill>
            </div>
          </SectionHeader>

            <FieldsGrid>
              <Field>
                <label>Prawda / Fałsz</label>
                <Counter>
                  <button type="button" onClick={() => setTfCount(Math.max(0, tfCount - 1))}>−</button>
                  <input type="number" value={tfCount} onChange={(e) => setTfCount(Math.max(0, Number(e.target.value)))} />
                  <button type="button" onClick={() => setTfCount(tfCount + 1)}>+</button>
                </Counter>
                <HelpRow>Typ zamknięty</HelpRow>
              </Field>

              <Field>
                <label>Jednokrotnego wyboru</label>
                <Counter>
                  <button type="button" onClick={() => setSingleCount(Math.max(0, singleCount - 1))}>−</button>
                  <input type="number" value={singleCount} onChange={(e) => setSingleCount(Math.max(0, Number(e.target.value)))} />
                  <button type="button" onClick={() => setSingleCount(singleCount + 1)}>+</button>
                </Counter>
                <HelpRow>Typ zamknięty</HelpRow>
              </Field>

              <Field>
                <label>Wielokrotnego wyboru</label>
                <Counter>
                  <button type="button" onClick={() => setMultiCount(Math.max(0, multiCount - 1))}>−</button>
                  <input type="number" value={multiCount} onChange={(e) => setMultiCount(Math.max(0, Number(e.target.value)))} />
                  <button type="button" onClick={() => setMultiCount(multiCount + 1)}>+</button>
                </Counter>
                <HelpRow>Typ zamknięty</HelpRow>
              </Field>

              <Field>
                <label>Otwarte</label>
                <Counter>
                  <button type="button" onClick={() => setOpenCount(Math.max(0, openCount - 1))}>−</button>
                  <input type="number" value={openCount} onChange={(e) => setOpenCount(Math.max(0, Number(e.target.value)))} />
                  <button type="button" onClick={() => setOpenCount(openCount + 1)}>+</button>
                </Counter>
                <HelpRow>Wpisywana odpowiedź</HelpRow>
              </Field>
            </FieldsGrid>

            <HelpRow>
              Podgląd: {tfCount} P/F • {singleCount} jednokrotnego • {multiCount} wielokrotnego • {openCount} otwartych
            </HelpRow>
          </SectionCard>

          <SectionCard>
            <SectionHeader>
              <div>
                <h3>Poziom trudności</h3>
                <Hint>Rozdziel {totalAll || 0} pytań na łatwe / średnie / trudne.</Hint>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Pill $bg={PALETTE.diff.easyBg} $fg={PALETTE.diff.easyFg}>
                  Łatwe: {easyCount}
                </Pill>
                <Pill $bg={PALETTE.diff.medBg} $fg={PALETTE.diff.medFg}>
                  Średnie: {mediumCount}
                </Pill>
                <Pill $bg={PALETTE.diff.hardBg} $fg={PALETTE.diff.hardFg}>
                  Trudne: {hardCount}
                </Pill>
                <Pill $bg={PALETTE.total.bg} $fg={PALETTE.total.fg}>
                  Suma: {totalDifficulty}
                </Pill>
              </div>
            </SectionHeader>


            <FieldsGrid>
              <Field $invalid={!difficultyLocked && easyCount < 0}>
                <label>Łatwe</label>
                <Counter>
                  <button
                    type="button"
                    disabled={difficultyLocked}
                    onClick={() => setEasyCount(Math.max(0, easyCount - 1))}
                  >−</button>
                  <input
                    type="number"
                    disabled={difficultyLocked}
                    value={easyCount}
                    onChange={(e) => {
                      const v = Math.max(0, Number(e.target.value));
                      // nie pozwól przekroczyć totalAll
                      const rest = totalAll - (mediumCount + hardCount);
                      setEasyCount(Math.min(v, Math.max(0, rest)));
                    }}
                  />
                  <button
                    type="button"
                    disabled={difficultyLocked}
                    onClick={() => {
                      const rest = totalAll - (mediumCount + hardCount);
                      setEasyCount(Math.min(easyCount + 1, Math.max(0, rest)));
                    }}
                  >+</button>
                </Counter>
              </Field>

              <Field $invalid={!difficultyLocked && mediumCount < 0}>
                <label>Średnie</label>
                <Counter>
                  <button type="button" disabled={difficultyLocked} onClick={() => setMediumCount(Math.max(0, mediumCount - 1))}>−</button>
                  <input
                    type="number"
                    disabled={difficultyLocked}
                    value={mediumCount}
                    onChange={(e) => {
                      const v = Math.max(0, Number(e.target.value));
                      const rest = totalAll - (easyCount + hardCount);
                      setMediumCount(Math.min(v, Math.max(0, rest)));
                    }}
                  />
                  <button
                    type="button"
                    disabled={difficultyLocked}
                    onClick={() => {
                      const rest = totalAll - (easyCount + hardCount);
                      setMediumCount(Math.min(mediumCount + 1, Math.max(0, rest)));
                    }}
                  >+</button>
                </Counter>
              </Field>

              <Field $invalid={!difficultyLocked && hardCount < 0}>
                <label>Trudne</label>
                <Counter>
                  <button type="button" disabled={difficultyLocked} onClick={() => setHardCount(Math.max(0, hardCount - 1))}>−</button>
                  <input
                    type="number"
                    disabled={difficultyLocked}
                    value={hardCount}
                    onChange={(e) => {
                      const v = Math.max(0, Number(e.target.value));
                      const rest = totalAll - (easyCount + mediumCount);
                      setHardCount(Math.min(v, Math.max(0, rest)));
                    }}
                  />
                  <button
                    type="button"
                    disabled={difficultyLocked}
                    onClick={() => {
                      const rest = totalAll - (easyCount + mediumCount);
                      setHardCount(Math.min(hardCount + 1, Math.max(0, rest)));
                    }}
                  >+</button>
                </Counter>
              </Field>
            </FieldsGrid>

            <Divider />
          <DistributionBar aria-label="Rozkład trudności" $disabled={difficultyLocked}>
            <DistributionSegment $w={difficultyLocked ? 0 : easyPct} $bg={PALETTE.diff.easyBg} />
            <DistributionSegment $w={difficultyLocked ? 0 : medPct}  $bg={PALETTE.diff.medBg} />
            <DistributionSegment $w={difficultyLocked ? 0 : hardPct} $bg={PALETTE.diff.hardBg} />
          </DistributionBar>

          <HelpRow>
            Ł: {difficultyLocked ? 0 : easyPct}% • Ś: {difficultyLocked ? 0 : medPct}% • T: {difficultyLocked ? 0 : hardPct}%
          </HelpRow>

          {!hasStructure && (
            <HelpRow>Ustaw najpierw <strong>Strukturę pytań</strong>, aby odblokować rozdział trudności.</HelpRow>
          )}
          {difficultyMismatch && (
            <HelpRow style={{ color: "#725252ff" }}>
              Rozkład trudności (suma: {totalDifficulty}) musi równać się liczbie pytań (razem: {totalAll}).
            </HelpRow>
          )}
          </SectionCard>

          {/* Generowanie */}
          <GenerateButton
            onClick={handleGenerate}
            disabled={genLoading || materialUploading}
          >
            {genLoading ? "Generuję…" : "Generuj test"}
          </GenerateButton>

          {genError && <ErrorText>{genError}</ErrorText>}
        <Footer />
        </InnerWrapper>
      </ContentWrapper>
    </CreateTestWrapper>
  );
};

export default CreateTestPage;