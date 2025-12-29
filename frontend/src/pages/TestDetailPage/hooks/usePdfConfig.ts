import { useEffect, useState } from "react";
import type { PdfExportConfig } from "../../../services/test";
import { exportCustomPdf } from "../../../services/test";
import { useLoader } from "../../../components/Loader/GlobalLoader";
import { useJobPolling } from "../../../hooks/useJobPolling";

const API_BASE = import.meta.env.VITE_API_URL || "";

const defaultPdfConfig: PdfExportConfig = {
  answer_space_style: "blank",
  space_height_cm: 3,
  include_answer_key: false,
  generate_variants: false,
  variant_mode: "shuffle",
  swap_order_variants: null,
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
  };
  actions: {
    setPdfConfigOpen: (next: boolean) => void;
    updatePdfConfig: (updater: (cfg: PdfExportConfig) => PdfExportConfig) => void;
    resetPdfConfig: () => void;
    downloadCustomPdf: (testId: number) => Promise<void>;
  };
}

const usePdfConfig = () => {
  const { startLoading, stopLoading } = useLoader();
  const [pdfConfig, setPdfConfig] = useState<PdfExportConfig>(defaultPdfConfig);
  const [pdfConfigOpen, setPdfConfigOpen] = useState(false);
  const [pdfInProgress, setPdfInProgress] = useState(false);
  const {
    jobId,
    status: jobStatus,
    result: jobResult,
    error: jobError,
    isPolling,
    startPolling,
    reset: resetJobPolling,
  } = useJobPolling();

  const updatePdfConfig = (updater: (cfg: PdfExportConfig) => PdfExportConfig) => {
    setPdfConfig((cfg) => updater(cfg));
  };

  const resetPdfConfig = () => {
    setPdfConfig(defaultPdfConfig);
  };

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

  const downloadCustomPdf = async (testId: number) => {
    if (!testId) return;
    setPdfInProgress(true);
    try {
      startLoading();
      const enqueue = await exportCustomPdf(testId, pdfConfig);
      resetJobPolling();
      startPolling(enqueue.job_id);
    } catch (e: any) {
      setPdfInProgress(false);
      stopLoading();
      alert(e.message || "Nie udało się zainicjować eksportu PDF.");
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
        alert("Brak ścieżki do pliku w wyniku zadania.");
        stopLoading();
      } else {
        const resolved = resolveUrl(fileUrl);
        downloadFromUrl(resolved, filename)
          .catch((err) => {
            alert(err.message || "Nie udało się pobrać pliku PDF.");
          })
          .finally(() => {
            stopLoading();
          });
      }
      setPdfInProgress(false);
      resetJobPolling();
    } else if (normalized === "failed") {
      alert(jobError || (jobResult as any)?.error || "Eksport PDF nie powiódł się.");
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
    },
    actions: { setPdfConfigOpen, updatePdfConfig, resetPdfConfig, downloadCustomPdf },
  };
};

export default usePdfConfig;
