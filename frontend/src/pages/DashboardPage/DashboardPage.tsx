import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyTests } from "../../services/test";
import { useAuth } from "../../context/AuthContext";
import { getMyTests, generateTest } from "../../services/test";
import { uploadMaterial, type MaterialUploadResponse } from "../../services/materials";
import type { TestOut } from "../../services/test";
import Sidebar from "../../components/Sidebar/Sidebar";

// Import only the styles needed for the hub
import {
  DashboardWrapper,
  EmptyStateWrapper,
  EmptyStateImage,
  EmptyStateHeading,
  EmptyStateButton,
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
} from "./DashboardPage.styles";
import Footer from "../../components/Footer/Footer";

const EMPTY_ILLUSTRATION = "/src/assets/dashboard_welcome.png";
const HUB_ILLUSTRATION = "/src/assets/dashboard_welcome.png"; // You might want a different image

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const [tests, setTests] = useState<TestOut[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    getMyTests()
      .then((data) => setTests(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null; // Or a full-page spinner

  // Case 1: First-time user, no tests. Show a full-page welcome.
  if (tests.length === 0) {
    return (
      <EmptyStateWrapper>
        <EmptyStateImage src={EMPTY_ILLUSTRATION} alt="Brak testów" />
        <EmptyStateHeading>
          Stwórz swój pierwszy test, aby zacząć!
        </EmptyStateHeading>
        <EmptyStateButton onClick={() => navigate(`/tests/new`)}>
          + Utwórz nowy
        </EmptyStateButton>
      </EmptyStateWrapper>
    );
  }

  // Case 2: User has tests. Show the main dashboard "hub".
  return (
    <DashboardWrapper>
      <Sidebar
        tests={tests}
        onSelect={(testId) => navigate(`/tests/${testId}`)}
        onCreateNew={() => navigate(`/tests/new`)}
      />

      {/* This is the new "hub" content area, re-using EmptyState components */}
      {/* We pass $isHub to modify its style (see styles file) */}
      <EmptyStateWrapper $isHub={true}>
        <EmptyStateImage src={HUB_ILLUSTRATION} alt="Wybierz test" />
        <EmptyStateHeading>
          Witaj w panelu InQUIZitor!
        </EmptyStateHeading>
        <Subheading>
          Wybierz istniejący test z panelu bocznego, aby zobaczyć szczegóły, lub utwórz nowy.
        </Subheading>
        <EmptyStateButton onClick={() => navigate(`/tests/new`)}>
          + Utwórz nowy
        </EmptyStateButton>
        <Footer />
      </EmptyStateWrapper>
    </DashboardWrapper>
  );
};

export default DashboardPage;
