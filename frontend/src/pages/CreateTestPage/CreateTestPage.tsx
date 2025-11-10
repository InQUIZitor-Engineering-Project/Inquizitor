import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyTests, generateTest } from "../../services/test";
import { uploadMaterial, type MaterialUploadResponse } from "../../services/materials";
import type { TestOut } from "../../services/test";
import Footer from "../../components/Footer/Footer";
import Sidebar from "../../components/Sidebar/Sidebar";
import { useLoader } from "../../components/Loader/GlobalLoader";

import {
  CreateTestWrapper,
  ContentWrapper,
  InnerWrapper,
  Heading,
  Subheading,
  ToggleGroup,
  TextArea,
  QuestionTypeGroup,
  DifficultyGroup,
  DifficultyField,
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
} from "./CreateTestPage.styles";

const CreateTestPage: React.FC = () => {
  const navigate = useNavigate();
  const { withLoader } = useLoader();

  // Sidebar
  const [tests, setTests] = useState<TestOut[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [sourceType, setSourceType] = useState<"text" | "material">("text");
  const [sourceContent, setSourceContent] = useState("");
  const [questionScope, setQuestionScope] = useState<"closed" | "open">("closed");
  const [closedType, setClosedType] = useState<"tf" | "multi" | "single">("tf");
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

  useEffect(() => {
    getMyTests()
      .then((data) => setTests(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleGenerate = async () => {
    setGenError(null);
    setGenLoading(true);

    const total = easyCount + mediumCount + hardCount;
    const num_closed = questionScope === "closed" ? total : 0;
    const num_open = questionScope === "open" ? total : 0;
    const textPayload = sourceContent.trim();

    if (sourceType === "material") {
      if (!materialData || !materialData.file_id) {
        setGenError("Najpierw wgraj materiał dydaktyczny.");
        setGenLoading(false);
        return;
      }
      if (!textPayload) {
        setGenError("Tekst materiału jest pusty – uzupełnij go przed generowaniem.");
        setGenLoading(false);
        return;
      }
    }

    if (sourceType === "text" && !textPayload) {
      setGenError("Wklej lub wpisz treść, na podstawie której wygenerujemy test.");
      setGenLoading(false);
      return;
    }

    if (total <= 0) {
      setGenError("Podaj liczbę pytań dla co najmniej jednego poziomu trudności.");
      setGenLoading(false);
      return;
    }

    const closed_types =
      questionScope === "closed"
        ? (() => {
            switch (closedType) {
              case "tf":
                return ["true_false"] as (
                  | "true_false"
                  | "single_choice"
                  | "multi_choice"
                )[];
              case "single":
                return ["single_choice"] as (
                  | "true_false"
                  | "single_choice"
                  | "multi_choice"
                )[];
              case "multi":
                return ["multi_choice"] as (
                  | "true_false"
                  | "single_choice"
                  | "multi_choice"
                )[];
              default:
                return undefined;
            }
          })()
        : undefined;

    try {
      const resp = await withLoader(() =>
        generateTest({
          num_closed,
          num_open,
          closed_types,
          easy: easyCount,
          medium: mediumCount,
          hard: hardCount,
          text: textPayload || undefined,
          file_id: sourceType === "material" ? materialData?.file_id : undefined,
        })
      );

      navigate(`/tests/${resp.test_id}`);
    } catch (err: any) {
      setGenError(err.message || "Wystąpił błąd przy generowaniu testu");
    } finally {
      setGenLoading(false);
    }
  };

  if (loading) return null;

  return (
    <CreateTestWrapper>
      <Sidebar
        tests={tests}
        onSelect={(testId) => navigate(`/tests/${testId}`)}
        onCreateNew={() => navigate(`/tests/new`)}
      />

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
                  accept=".pdf,.docx,.txt,.md"
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
                <h3>Typ pytań</h3>
                <Hint>Wybierz, czy interesują Cię pytania zamknięte czy otwarte.</Hint>
              </div>
            </SectionHeader>

            <ToggleGroup>
              <button
                className={questionScope === "closed" ? "active" : ""}
                onClick={() => setQuestionScope("closed")}
              >
                Pytania zamknięte
              </button>
              <button
                className={questionScope === "open" ? "active" : ""}
                onClick={() => setQuestionScope("open")}
              >
                Pytania otwarte
              </button>
            </ToggleGroup>

            {questionScope === "closed" && (
              <>
                <Subheading>Rodzaj pytań zamkniętych</Subheading>
                <QuestionTypeGroup>
                  <button
                    className={closedType === "tf" ? "active" : ""}
                    onClick={() => setClosedType("tf")}
                  >
                    Prawda / Fałsz
                  </button>
                  <button
                    className={closedType === "single" ? "active" : ""}
                    onClick={() => setClosedType("single")}
                  >
                    Jednokrotnego wyboru
                  </button>
                  <button
                    className={closedType === "multi" ? "active" : ""}
                    onClick={() => setClosedType("multi")}
                  >
                    Wielokrotnego wyboru
                  </button>
                </QuestionTypeGroup>
              </>
            )}
          </SectionCard>

          {/* Trudność i liczba pytań */}
          <SectionCard>
            <SectionHeader>
              <div>
                <h3>Liczba pytań i poziom trudności</h3>
                <Hint>
                  Podaj, ile pytań łatwych, średnich i trudnych chcesz wygenerować.
                </Hint>
              </div>
            </SectionHeader>

            <DifficultyGroup>
              <DifficultyField>
                <label>Pytania łatwe</label>
                <input
                  type="number"
                  min={0}
                  value={easyCount}
                  onChange={(e) => setEasyCount(Math.max(0, Number(e.target.value)))}
                />
              </DifficultyField>
              <DifficultyField>
                <label>Pytania średnie</label>
                <input
                  type="number"
                  min={0}
                  value={mediumCount}
                  onChange={(e) =>
                    setMediumCount(Math.max(0, Number(e.target.value)))
                  }
                />
              </DifficultyField>
              <DifficultyField>
                <label>Pytania trudne</label>
                <input
                  type="number"
                  min={0}
                  value={hardCount}
                  onChange={(e) => setHardCount(Math.max(0, Number(e.target.value)))}
                />
              </DifficultyField>
            </DifficultyGroup>

            <Hint>
              Razem: {easyCount + mediumCount + hardCount} pytań{" "}
              {questionScope === "closed"
                ? "zamkniętych"
                : questionScope === "open"
                ? "otwartych"
                : ""}
            </Hint>
          </SectionCard>

          {/* Generowanie */}
          <GenerateButton
            onClick={handleGenerate}
            disabled={genLoading || materialUploading}
          >
            {genLoading ? "Generuję…" : "Generuj test"}
          </GenerateButton>

          {genError && <ErrorText>{genError}</ErrorText>}

        </InnerWrapper>
        <Footer />

      </ContentWrapper>
    </CreateTestWrapper>
  );
};

export default CreateTestPage;
