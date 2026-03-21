import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import type { PdfExportConfig } from "../../../services/test";
import { exportCustomPdf } from "../../../services/test";
import { useLoader } from "../../../components/Loader/GlobalLoader";
import { useJobPolling } from "../../../hooks/useJobPolling";

const API_BASE = import.meta.env.VITE_API_URL || "";

const defaultPdfConfig: PdfExportConfig = {
  answer_space_style: "blank",
  space_height_cm: 3,
  include_answer_key: false,
  student_header: true,
  use_scratchpad: false,
  mark_multi_choice: true,
};

export interface UsePdfConfigResult {
  state: {
    pdfConfig: PdfExportConfig;
    pdfConfigOpen: boolean;
    pdfJobStatus: string | null;
    pdfJobId: number | null;
    pdfInProgress: boolean;
    exportError: string | null;
  };
  actions: {
    setPdfConfigOpen: (next: boolean) => void;
    updatePdfConfig: (updater: (cfg: PdfExportConfig) => PdfExportConfig) => void;
    resetPdfConfig: () => void;
    downloadCustomPdf: (testId: number) => Promise<void>;
    clearExportError: () => void;
  };
}

const usePdfConfig = (): UsePdfConfigResult => {
  const { testId } = useParams<{ testId: string }>();
  const { startLoading, stopLoading } = useLoader();

  const [pdfConfig, setPdfConfig] = useState<PdfExportConfig>(() => {
    if (!testId) return defaultPdfConfig;

    try {
      const savedKey = `pdf_config_${testId}`;
      const saved = localStorage.getItem(savedKey);
      return saved ? { ...defaultPdfConfig, ...JSON.parse(saved) } : defaultPdfConfig;
    } catch (e) {
      console.warn("Błąd odczytu konfiguracji PDF z localStorage", e);
      return defaultPdfConfig;
    }
  });

  const [pdfConfigOpen, setPdfConfigOpen] = useState(false);
  const [pdfInProgress, setPdfInProgress] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  
  const {
    jobId,
    status: jobStatus,
    result: jobResult,
    error: jobError,
    isPolling,
    startPolling,
    reset: resetJobPolling,
  } = useJobPolling();

  useEffect(() => {
    if (!testId) return;
    const key = `pdf_config_${testId}`;
    try {
      localStorage.setItem(key, JSON.stringify(pdfConfig));
    } catch (e) {
      console.warn("Błąd zapisu konfiguracji PDF do localStorage", e);
    }
  }, [pdfConfig, testId]);

  const updatePdfConfig = useCallback((updater: (cfg: PdfExportConfig) => PdfExportConfig) => {
    setPdfConfig((prev) => updater(prev));
  }, []);

  const resetPdfConfig = useCallback(() => {
    setPdfConfig(defaultPdfConfig);
  }, []);


  const resolveUrl = (pathOrUrl: string) => {
    if (!pathOrUrl) return "";
    if (pathOrUrl.startsWith("http")) return pathOrUrl;
    const normalized = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
    return `${API_BASE}${normalized}`;
  };

  const downloadFromUrl = async (url: string, filename: string) => {
    const token = localStorage.getItem("access_token");
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) {
      throw new Error("Nie udało się pobrać pliku PDF.");
    }
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const clearExportError = useCallback(() => setExportError(null), []);

  const downloadCustomPdf = async (targetTestId: number) => {
    if (!targetTestId) return;
    setExportError(null);
    setPdfInProgress(true);
    try {
      startLoading();
      const enqueue = await exportCustomPdf(targetTestId, pdfConfig);
      resetJobPolling();
      startPolling(enqueue.job_id);
    } catch (e: any) {
      setPdfInProgress(false);
      stopLoading();
      setExportError(e.message || "Nie udało się zainicjować eksportu PDF.");
      resetJobPolling();
    }
  };

  useEffect(() => {
    const normalized = (jobStatus || "").toLowerCase();
    if (!normalized) return;

    if (normalized === "done") {
      const fileUrl = (jobResult as any)?.file_url || (jobResult as any)?.file_path;
      const filename = (jobResult as any)?.filename || `test_${(jobResult as any)?.test_id || "export"}.pdf`;
      if (!fileUrl) {
        setExportError("Brak ścieżki do pliku w wyniku zadania.");
        stopLoading();
      } else {
        const resolved = resolveUrl(fileUrl);
        downloadFromUrl(resolved, filename)
          .catch((err) => {
            setExportError(err.message || "Nie udało się pobrać pliku PDF.");
          })
          .finally(() => {
            stopLoading();
          });
      }
      setPdfInProgress(false);
      resetJobPolling();
    } else if (normalized === "failed") {
      setExportError(jobError || (jobResult as any)?.error || "Eksport PDF nie powiódł się.");
      setPdfInProgress(false);
      stopLoading();
      resetJobPolling();
    }
  }, [jobStatus, jobResult, jobError, resetJobPolling, stopLoading]);

  return {
    state: {
      pdfConfig,
      pdfConfigOpen,
      pdfJobStatus: jobStatus || null,
      pdfJobId: jobId,
      pdfInProgress: pdfInProgress || isPolling,
      exportError,
    },
    actions: {
      setPdfConfigOpen,
      updatePdfConfig,
      resetPdfConfig,
      downloadCustomPdf,
      clearExportError,
    },
  };
};

export default usePdfConfig;