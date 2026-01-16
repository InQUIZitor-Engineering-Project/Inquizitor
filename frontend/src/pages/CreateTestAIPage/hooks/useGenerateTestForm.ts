import { useEffect, useRef, useState } from "react";
import { useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import { generateTest, getJob, getTestConfig, type JobOut } from "../../../services/test";
import {
  analyzeMaterials,
  deleteMaterial,
  getMaterial,
  uploadMaterials,
  type MaterialAnalyzeJob,
  type MaterialUploadResponse,
} from "../../../services/materials";
import { useLoader } from "../../../components/Loader/GlobalLoader";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useJobPolling } from "../../../hooks/useJobPolling";
import { MAX_QUESTIONS_TOTAL } from "../constants";

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
    materials: MaterialUploadResponse[];
    materialUploading: boolean;
    materialError: string | null;
    materialAnalyzing: boolean;
    uploadingMaterials: {
      tempId: string;
      filename: string;
      sizeBytes: number;
      status: "uploading" | "failed";
      error?: string;
    }[];
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
    totalMaterialPages: number;
    materialLimitExceeded: boolean;
    canGenerate: boolean;
    primaryValidationError: string | null;
  };
  status: {
    genError: string | null;
    genLoading: boolean;
    isEditing: boolean;
    editTestId: string | null;
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
    handleMaterialChange: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
    handleRemoveMaterial: (materialId: number) => Promise<void>;
    handleRemoveUpload: (tempId: string) => void;
    handleGenerate: () => Promise<void>;
  };
}

const useGenerateTestForm = (): UseGenerateTestFormResult => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromTestId = searchParams.get("from");
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

  // Pre-fill logic for edit mode
  useEffect(() => {
    if (fromTestId) {
      const fetchConfig = async () => {
        try {
          startLoading();
          const config = await getTestConfig(parseInt(fromTestId));
          
          if (config.material_ids && config.material_ids.length > 0) {
            setSourceType("material");
            // Pobieramy dane o plikach, aby wyświetlić je na liście
            try {
              const materialData = await Promise.all(
                config.material_ids.map(id => getMaterial(id))
              );
              setMaterials(materialData);
              // Odtwarzamy połączony tekst
              const combinedText = materialData
                .map(m => m.extracted_text)
                .filter(Boolean)
                .join("\n\n");
              setSourceContent(combinedText);
            } catch (err) {
              console.error("Failed to fetch material details:", err);
              // Jeśli nie uda się pobrać plików, spróbujemy chociaż odtworzyć tekst jeśli jest w configu
              if (config.text) setSourceContent(config.text);
            }
          } else if (config.text) {
            setSourceType("text");
            setSourceContent(config.text);
          } else if (config.file_id) {
            // Legacy fallback dla pojedynczego file_id
            setSourceType("material");
          }
          
          setTfCount(config.closed.true_false);
          setSingleCount(config.closed.single_choice);
          setMultiCount(config.closed.multi_choice);
          setOpenCount(config.num_open);
          
          setEasyCount(config.easy);
          setMediumCount(config.medium);
          setHardCount(config.hard);
          
          if (config.additional_instructions) {
            setInstructions(config.additional_instructions);
            setIsPersonalizationOpen(true);
          }
        } catch {
          setGenError("Nie udało się pobrać poprzedniej konfiguracji testu.");
        } finally {
          stopLoading();
        }
      };
      fetchConfig();
    }
  }, [fromTestId]);

  const [materials, setMaterials] = useState<MaterialUploadResponse[]>([]);
  const [materialUploading, setMaterialUploading] = useState(false);
  const [materialError, setMaterialError] = useState<string | null>(null);
  const [materialAnalyzing, setMaterialAnalyzing] = useState(false);
  const [materialJobs, setMaterialJobs] = useState<MaterialAnalyzeJob[]>([]);
  const [uploadingMaterials, setUploadingMaterials] = useState<
    {
      tempId: string;
      filename: string;
      sizeBytes: number;
      status: "uploading" | "failed";
      error?: string;
    }[]
  >([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useDocumentTitle("Stwórz nowy | Inquizitor");

  const MAX_FILE_SIZE_MB = 15; 
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
  const MAX_TOTAL_PAGES = 20;
  const totalClosed = tfCount + singleCount + multiCount;
  const totalAll = totalClosed + openCount;
  const totalDifficulty = easyCount + mediumCount + hardCount;

  const hasStructure = totalAll > 0;
  const difficultyLocked = !hasStructure;
  const difficultyMismatch = hasStructure && totalDifficulty !== totalAll;
  const totalMaterialPages = materials.reduce(
    (sum, material) => sum + (material.page_count ?? 1),
    0
  );
  const materialLimitExceeded = totalMaterialPages > MAX_TOTAL_PAGES;

  let primaryValidationError: string | null = null;

  if (materialUploading || materialAnalyzing) {
    primaryValidationError = "Twoje pliki są analizowane, proszę czekać.";
  } else if (sourceContent.trim().length < 100) {
    primaryValidationError = "Wgraj plik lub wpisz co najmniej 100 znaków tekstu źródłowego.";
  } else if (totalAll === 0) {
    primaryValidationError = "Ustal liczbę pytań na co najmniej 1.";
  } else if (difficultyMismatch) {
    primaryValidationError = "Dopasuj podział na poziomy trudności do liczby pytań.";
  }

  const canGenerate = primaryValidationError === null;

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
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    const oversized = files.find((file) => file.size > MAX_FILE_SIZE_BYTES);
    if (oversized) {
      setMaterialError(
        `Plik "${oversized.name}" jest za duży (max ${MAX_FILE_SIZE_MB}MB).`
      );
      clearFileInput();
      return;
    }

    setMaterialError(null);
    setMaterialUploading(true);

    const uploads = files.map((file) => {
      const tempId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      return {
        tempId,
        filename: file.name,
        sizeBytes: file.size,
        status: "uploading" as const,
        file,
      };
    });

    setUploadingMaterials((prev) => [
      ...prev,
      ...uploads.map(({ tempId, filename, sizeBytes, status }) => ({
        tempId,
        filename,
        sizeBytes,
        status,
      })),
    ]);

    await Promise.all(
      uploads.map(async ({ file, tempId }) => {
        try {
          const result = await uploadMaterials([file]);
          const uploaded = result.materials[0];
          if (uploaded) {
            let nextTotal = 0;
            setMaterials((prev) => {
              nextTotal = prev.reduce(
                (sum, material) => sum + (material.page_count ?? 1),
                0
              );
              nextTotal += uploaded.page_count ?? 1;
              return [...prev, uploaded];
            });
            if (nextTotal > MAX_TOTAL_PAGES) {
              setMaterialError(
                `Limit stron przekroczony (max ${MAX_TOTAL_PAGES}). Usuń część plików.`
              );
            } else {
              try {
                setMaterialAnalyzing(true);
                const analyzeResult = await analyzeMaterials([uploaded.id]);
                setMaterialJobs((prev) => [...prev, ...analyzeResult.jobs]);
              } catch (error: any) {
                setMaterialError(
                  error.message || "Nie udało się rozpocząć analizy pliku."
                );
                setMaterialAnalyzing(false);
              }
            }
          }
          setUploadingMaterials((prev) =>
            prev.filter((item) => item.tempId !== tempId)
          );
        } catch (error: any) {
          setUploadingMaterials((prev) =>
            prev.map((item) =>
              item.tempId === tempId
                ? {
                    ...item,
                    status: "failed",
                    error: error.message || "Nie udało się wgrać pliku.",
                  }
                : item
            )
          );
        }
      })
    );

    setMaterialUploading(false);
    setGenError(null);
    clearFileInput();
  };

  const buildSourceFromMaterials = (items: MaterialUploadResponse[]) =>
    items
      .map((item) => item.extracted_text)
      .filter(Boolean)
      .join("\n\n");

  const handleRemoveMaterial = async (materialId: number) => {
    setMaterialError(null);
    try {
      await deleteMaterial(materialId);
      setMaterials((prev) => {
        const next = prev.filter((item) => item.id !== materialId);
        if (sourceType === "material") {
          setSourceContent(buildSourceFromMaterials(next));
        }
        return next;
      });
    } catch (error: any) {
      setMaterialError(error.message || "Nie udało się usunąć materiału.");
    }
  };

  const handleRemoveUpload = (tempId: string) => {
    setUploadingMaterials((prev) => prev.filter((item) => item.tempId !== tempId));
  };


  const clampNonNegative = (v: number) => Math.max(0, v);
  const clampToTotalLimit = (v: number) => Math.min(MAX_QUESTIONS_TOTAL, clampNonNegative(v));

  const clampByRemaining = (v: number, remaining: number) =>
    Math.min(clampToTotalLimit(v), Math.max(0, remaining));

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
    if (!canGenerate) return;

    setGenError(null);
    setGenLoading(true);

    const textPayload = sourceContent.trim();

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
        material_ids: sourceType === "material" ? materials.map(m => m.id) : undefined,
        additional_instructions: instructions.trim() || undefined,
      });

      resetJobPolling();
      startPolling(enqueue.job_id);
    } catch (err: any) {
      setGenError(err.message || "Wystąpił błąd przy generowaniu testu. Spróbuj ponownie.");
      setGenLoading(false);
      stopLoading();
      resetJobPolling();
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
  }, [
    jobStatus,
    jobResult,
    jobError,
    navigate,
    refreshSidebarTests,
    resetJobPolling,
    stopLoading,
  ]);

  useEffect(() => {
    if (!materialAnalyzing || !materialJobs.length) return;

    let cancelled = false;
    let timeoutId: number | null = null;

    const pollJobs = async () => {
      try {
        const results: JobOut[] = await Promise.all(
          materialJobs.map((job) => getJob(job.job_id))
        );
        if (cancelled) return;

        const statuses = results.map((job) => (job.status || "").toLowerCase());
        const allFinished = statuses.every(
          (status) => status === "done" || status === "failed"
        );

        if (allFinished) {
          const failures = results.filter(
            (job) => (job.status || "").toLowerCase() === "failed"
          );
          if (failures.length) {
            setMaterialError(
              failures[0].error ||
                "Nie udało się wyodrębnić tekstu z części plików."
            );
          }

          const statusUpdateByMaterialId = new Map<number, { status: string; error?: string; text?: string }>();
          results.forEach((job, index) => {
            const mId = materialJobs[index].material.id;
            const res = job.result as any;
            statusUpdateByMaterialId.set(mId, {
              status: (job.status || "").toLowerCase(),
              error: job.error || res?.processing_error || res?.error,
              text: res?.extracted_text,
            });
          });

          setMaterials((prev) => {
            const updated = prev.map((item) => {
              const info = statusUpdateByMaterialId.get(item.id);
              if (!info) return item;
              return {
                ...item,
                processing_status: info.status === "done" ? "done" : info.status === "failed" ? "failed" : item.processing_status,
                extracted_text: info.text ?? item.extracted_text,
                processing_error: info.error ?? item.processing_error,
              };
            });

            const combinedText = updated
              .map((item) => item.extracted_text)
              .filter(Boolean)
              .join("\n\n");

            if (combinedText) {
              setSourceContent(combinedText);
            }

            return updated;
          });

          setMaterialAnalyzing(false);
          setMaterialJobs([]);
          return;
        }

        timeoutId = window.setTimeout(pollJobs, 1500);
      } catch (err: any) {
        if (cancelled) return;
        setMaterialError(err.message || "Nie udało się pobrać statusu analizy.");
        timeoutId = window.setTimeout(pollJobs, 1500);
      }
    };

    pollJobs();

    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [materialAnalyzing, materialJobs]);

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
      materials,
      materialUploading,
      materialError,
      materialAnalyzing,
      uploadingMaterials,
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
      totalMaterialPages,
      materialLimitExceeded,
      canGenerate,
      primaryValidationError,
    },
    status: { 
      genError, 
      genLoading: genLoading || jobPolling,
      isEditing: !!fromTestId,
      editTestId: fromTestId
    },
    job: { jobId, jobStatus, jobPolling },
    refs: { fileInputRef },
    actions: {
      setSourceType,
      setSourceContent,
      setInstructions,
      setIsPersonalizationOpen,
      setTfCount: (v: number) =>
        setTfCount(clampByRemaining(v, MAX_QUESTIONS_TOTAL - (singleCount + multiCount + openCount))),
      setSingleCount: (v: number) =>
        setSingleCount(clampByRemaining(v, MAX_QUESTIONS_TOTAL - (tfCount + multiCount + openCount))),
      setMultiCount: (v: number) =>
        setMultiCount(clampByRemaining(v, MAX_QUESTIONS_TOTAL - (tfCount + singleCount + openCount))),
      setOpenCount: (v: number) =>
        setOpenCount(clampByRemaining(v, MAX_QUESTIONS_TOTAL - (tfCount + singleCount + multiCount))),
      setEasyCount: safeSetEasy,
      setMediumCount: safeSetMedium,
      setHardCount: safeSetHard,
      handleMaterialButtonClick,
      handleMaterialChange,
      handleRemoveMaterial,
      handleRemoveUpload,
      handleGenerate,
    },
  };
};

export default useGenerateTestForm;
