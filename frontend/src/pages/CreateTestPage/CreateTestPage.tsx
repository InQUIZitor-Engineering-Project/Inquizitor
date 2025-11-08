import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyTests, generateTest } from "../../services/test";
import { uploadMaterial, type MaterialUploadResponse } from "../../services/materials";
import type { TestOut } from "../../services/test";
import Footer from "../../components/Footer/Footer";
import Sidebar from "../../components/Sidebar/Sidebar";

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
} from "./CreateTestPage.styles";

const CreateTestPage: React.FC = () => {
  const navigate = useNavigate();

  // State for the sidebar
  const [tests, setTests] = useState<TestOut[]>([]);
  const [loading, setLoading] = useState(true);

  // State for the form
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
    if (!file) {
      return;
    }

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


  // Effect to load tests for the sidebar
  useEffect(() => {
    getMyTests()
      .then((data) => setTests(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleGenerate = async () => {
    setGenError(null);
    setGenLoading(true);

    const num_closed = questionScope === "closed" ? easyCount + mediumCount + hardCount : 0;
    const num_open = questionScope === "open" ? easyCount + mediumCount + hardCount : 0;
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
      const resp = await generateTest({
        num_closed,
        num_open,
        closed_types,
        easy: easyCount,
        medium: mediumCount,
        hard: hardCount,
        text: textPayload || undefined,
        file_id: sourceType === "material" ? materialData?.file_id : undefined,
      });

      navigate(`/tests/${resp.test_id}`);
    } catch (err: any) {
      setGenError(err.message || "Wystąpił błąd przy generowaniu testu");
    } finally {
      setGenLoading(false);
    }
  };

  if (loading) return null; // You might want a loading spinner here

  return (
    // Use the new Wrapper
    <CreateTestWrapper>
      <Sidebar
        tests={tests}
        onSelect={(testId) => navigate(`/tests/${testId}`)}
        onCreateNew={() => navigate(`/tests/new`)}
      />

      {/* This is the form content, moved from DashboardPage */}
      <ContentWrapper>
        <InnerWrapper>
          <Heading>Utwórz test dopasowany do swoich potrzeb</Heading>

          <Subheading>Z jakich materiałów chcesz skorzystać?</Subheading>
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
              Materiał dydaktyczny
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

          <Subheading>Wpisz treść, na podstawie której powstanie Twój test</Subheading>
          <TextArea
            value={sourceContent}
            onChange={(e) => setSourceContent(e.target.value)}
            placeholder="Wklej treść..."
          />

          <Subheading>Wybierz typ pytań</Subheading>
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
                  className={closedType === "multi" ? "active" : ""}
                  onClick={() => setClosedType("multi")}
                >
                  Wielokrotnego wyboru
                </button>
                <button
                  className={closedType === "single" ? "active" : ""}
                  onClick={() => setClosedType("single")}
                >
                  Jednokrotnego wyboru
                </button>
              </QuestionTypeGroup>
            </>
          )}

          <Subheading>Ustal liczbę pytań oraz poziom trudności</Subheading>
          <DifficultyGroup>
            <DifficultyField>
              <label>Pytania łatwe:</label>
              <input
                type="number"
                value={easyCount}
                onChange={(e) => setEasyCount(Number(e.target.value))}
              />
            </DifficultyField>
            <DifficultyField>
              <label>Pytania średnie:</label>
              <input
                type="number"
                value={mediumCount}
                onChange={(e) => setMediumCount(Number(e.target.value))}
              />
            </DifficultyField>
            <DifficultyField>
              <label>Pytania trudne:</label>
              <input
                type="number"
                value={hardCount}
                onChange={(e) => setHardCount(Number(e.target.value))}
              />
            </DifficultyField>
          </DifficultyGroup>

          <GenerateButton
            onClick={handleGenerate}
            disabled={genLoading || materialUploading}
          >          {genLoading ? "Generuję…" : "Generuj test"}
          </GenerateButton>
          {genError && <Subheading style={{ color: "red" }}>{genError}</Subheading>}
        </InnerWrapper>
        <Footer/>
      </ContentWrapper>
    </CreateTestWrapper>
  );
};

export default CreateTestPage;
