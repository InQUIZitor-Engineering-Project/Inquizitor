import { useEffect, useRef, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { generateTest } from "../../../services/test";
import { uploadMaterial, type MaterialUploadResponse, type MaterialUploadEnqueueResponse } from "../../../services/materials";
import { useLoader } from "../../../components/Loader/GlobalLoader";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useJobPolling } from "../../../hooks/useJobPolling";

type LayoutCtx = { refreshSidebarTests: () => Promise<void> };

export interface UseGenerateTestFormResult {
  state: {
    sourceType: "text" | "material";
    sourceContent: string;
    instructions: string;
    tfCount: number;
    singleCount: number;
    multiCount: number;
    openCount: number;
    easyCount: number;
    mediumCount: number;
    hardCount: number;
    isPersonalizationOpen: boolean;
    materialData: MaterialUploadResponse | null;
    materialUploading: boolean;
    materialError: string | null;
  };
  derived: {
    totalClosed: number;
    totalAll: number;
    totalDifficulty: number;
    easyPct: number;
    medPct: number;
    hardPct: number;
    hasStructure: boolean;
    difficultyLocked: boolean;
    difficultyMismatch: boolean;
  };
  status: {
    genError: string | null;
    genLoading: boolean;
  };
  job: {
    jobId: number | null;
    jobStatus: string | null;
    jobPolling: boolean;
  };
  refs: {
    fileInputRef: React.RefObject<HTMLInputElement | null>;
  };
  actions: {
    setSourceType: (next: "text" | "material") => void;
    setSourceContent: (value: string) => void;
    setInstructions: (value: string) => void;
    setIsPersonalizationOpen: (value: boolean) => void;
    setTfCount: (v: number) => void;
    setSingleCount: (v: number) => void;
    setMultiCount: (v: number) => void;
    setOpenCount: (v: number) => void;
    setEasyCount: (v: number) => void;
    setMediumCount: (v: number) => void;
    setHardCount: (v: number) => void;
    handleMaterialButtonClick: () => void;
    handleMaterialChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleGenerate: () => Promise<void>;
  };
}

const useGenerateTestForm = (): UseGenerateTestFormResult => {
  const navigate = useNavigate();
  const { refreshSidebarTests } = useOutletContext<LayoutCtx>();
  const { startLoading, stopLoading } = useLoader();
  const {
    jobId,
    status: jobStatus,
    result: jobResult,
    error: jobError,
    isPolling: jobPolling,
    startPolling,
    reset: resetJobPolling,
  } = useJobPolling();
  const {
    status: materialJobStatus,
    result: materialJobResult,
    error: materialJobError,
    startPolling: startMaterialPolling,
    reset: resetMaterialPolling,
  } = useJobPolling();

  const [sourceType, setSourceType] = useState<"text" | "material">("text");
  const [sourceContent, setSourceContent] = useState("");
  const [instructions, setInstructions] = useState("");
  const [tfCount, setTfCount] = useState(0);
  const [singleCount, setSingleCount] = useState(0);
  const [multiCount, setMultiCount] = useState(0);
  const [openCount, setOpenCount] = useState(0);
  const [easyCount, setEasyCount] = useState(0);
  const [mediumCount, setMediumCount] = useState(0);
  const [hardCount, setHardCount] = useState(0);

  const [isPersonalizationOpen, setIsPersonalizationOpen] = useState(false);

  const [genError, setGenError] = useState<string | null>(null);
  const [genLoading, setGenLoading] = useState(false);

  const [materialData, setMaterialData] = useState<MaterialUploadResponse | null>(null);
  const [materialUploading, setMaterialUploading] = useState(false);
  const [materialError, setMaterialError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useDocumentTitle("Stwórz nowy | Inquizitor");

  const MAX_FILE_SIZE_MB = 15; 
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
  const totalClosed = tfCount + singleCount + multiCount;
  const totalAll = totalClosed + openCount;
  const totalDifficulty = easyCount + mediumCount + hardCount;

  const hasStructure = totalAll > 0;
  const difficultyLocked = !hasStructure;
  const difficultyMismatch = hasStructure && totalDifficulty !== totalAll;

  const pct = (n: number, t: number) =>
    t > 0 ? Math.max(0, Math.min(100, Math.round((n / t) * 100))) : 0;

  const easyPct = pct(easyCount, totalDifficulty);
  const medPct = pct(easyCount + mediumCount, totalDifficulty) - easyPct;
  const hardPct = totalDifficulty > 0 ? 100 - easyPct - medPct : 0;
  const clearFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleMaterialButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleMaterialChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE_BYTES) {
        setMaterialError(
            `Ten plik jest za duży (max ${MAX_FILE_SIZE_MB}MB). Spróbuj podzielić go na części i spróbować ponownie.`
        );
        clearFileInput();
        return; 
    }

    setMaterialError(null);
    setMaterialUploading(true);
    resetMaterialPolling();
    try {
      const enqueue: MaterialUploadEnqueueResponse = await uploadMaterial(file);
      setMaterialData(enqueue.material);
      setGenError(null);
      startMaterialPolling(enqueue.job_id);
    } catch (error: any) {
      setMaterialData(null);
      setMaterialError(error.message || "Nie udało się wgrać materiału.");
      setMaterialUploading(false);
      clearFileInput();
    }
  };

  const clampNonNegative = (v: number) => Math.max(0, v);

  const safeSetEasy = (v: number) => {
    const sanitized = clampNonNegative(v);
    const rest = totalAll - (mediumCount + hardCount);
    setEasyCount(Math.min(sanitized, Math.max(0, rest)));
  };

  const safeSetMedium = (v: number) => {
    const sanitized = clampNonNegative(v);
    const rest = totalAll - (easyCount + hardCount);
    setMediumCount(Math.min(sanitized, Math.max(0, rest)));
  };

  const safeSetHard = (v: number) => {
    const sanitized = clampNonNegative(v);
    const rest = totalAll - (easyCount + mediumCount);
    setHardCount(Math.min(sanitized, Math.max(0, rest)));
  };

  const handleGenerate = async () => {
    setGenError(null);
    setGenLoading(true);

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
      startLoading();
      const enqueue = await generateTest({
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
        additional_instructions: instructions.trim() || undefined,
        file_id: sourceType === "material" ? materialData?.file_id : undefined,
      });

      resetJobPolling();
      startPolling(enqueue.job_id);
    } catch (err: any) {
      setGenError(err.message || "Wystąpił błąd przy generowaniu testu. Spróbuj ponownie.");
      setGenLoading(false);
      stopLoading();
      resetJobPolling();
    } finally {
      // zakończymy loading po wyniku joba
    }
  };

  useEffect(() => {
    const normalized = (jobStatus || "").toLowerCase();
    if (!normalized) return;

    if (normalized === "done") {
      const testId = (jobResult as any)?.test_id;
      if (testId) {
        void refreshSidebarTests();
        navigate(`/tests/${testId}`);
      } else {
        setGenError("Zadanie zakończone, ale brak identyfikatora testu.");
      }
      setGenLoading(false);
      stopLoading();
      resetJobPolling();
    } else if (normalized === "failed") {
      setGenError(jobError || (jobResult as any)?.error || "Generowanie nie powiodło się.");
      setGenLoading(false);
      stopLoading();
      resetJobPolling();
    }
  }, [jobStatus, jobResult, jobError, navigate, refreshSidebarTests, resetJobPolling]);

  useEffect(() => {
    const normalized = (materialJobStatus || "").toLowerCase();
    if (!normalized) return;

    if (normalized === "done") {
      const extracted = (materialJobResult as any)?.extracted_text as string | undefined;
      const processingStatus = (materialJobResult as any)?.processing_status || "done";
      setMaterialData((prev) =>
        prev
          ? {
              ...prev,
              processing_status: processingStatus,
              extracted_text: extracted ?? prev.extracted_text,
              processing_error: null,
            }
          : prev
      );
      if (extracted) {
        setSourceContent(extracted);
      }
      setMaterialError(null);
      setMaterialUploading(false);
      resetMaterialPolling();
      clearFileInput();
    } else if (normalized === "failed") {
      const errMsg = materialJobError || (materialJobResult as any)?.error || "Nie udało się wyodrębnić tekstu z pliku.";
      setMaterialError(errMsg);
      setMaterialData((prev) =>
        prev
          ? {
              ...prev,
              processing_status: "failed",
              processing_error: errMsg,
            }
          : prev
      );
      setMaterialUploading(false);
      resetMaterialPolling();
      clearFileInput();
    }
  }, [materialJobStatus, materialJobResult, materialJobError]);

  return {
    state: {
      sourceType,
      sourceContent,
      instructions,
      tfCount,
      singleCount,
      multiCount,
      openCount,
      easyCount,
      mediumCount,
      hardCount,
      isPersonalizationOpen,
      materialData,
      materialUploading,
      materialError,
    },
    derived: {
      totalClosed,
      totalAll,
      totalDifficulty,
      easyPct,
      medPct,
      hardPct,
      hasStructure,
      difficultyLocked,
      difficultyMismatch,
    },
    status: { genError, genLoading: genLoading || jobPolling },
    job: { jobId, jobStatus, jobPolling },
    refs: { fileInputRef },
    actions: {
      setSourceType,
      setSourceContent,
      setInstructions,
      setIsPersonalizationOpen,
      setTfCount: (v: number) => setTfCount(clampNonNegative(v)),
      setSingleCount: (v: number) => setSingleCount(clampNonNegative(v)),
      setMultiCount: (v: number) => setMultiCount(clampNonNegative(v)),
      setOpenCount: (v: number) => setOpenCount(clampNonNegative(v)),
      setEasyCount: safeSetEasy,
      setMediumCount: safeSetMedium,
      setHardCount: safeSetHard,
      handleMaterialButtonClick,
      handleMaterialChange,
      handleGenerate,
    },
  };
};

export default useGenerateTestForm;
