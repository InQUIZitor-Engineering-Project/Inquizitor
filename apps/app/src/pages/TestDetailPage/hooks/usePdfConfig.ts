import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import type { PdfExportConfig } from "../../../services/test";
import { exportCustomPdf } from "../../../services/test";
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
  };
  actions: {
    setPdfConfigOpen: (next: boolean) => void;
    updatePdfConfig: (updater: (cfg: PdfExportConfig) => PdfExportConfig) => void;
    resetPdfConfig: () => void;
    downloadCustomPdf: (testId: number) => Promise<void>;
  };
}

const usePdfConfig = (): UsePdfConfigResult => {
  const { testId } = useParams<{ testId: string }>();

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

  const testIdRef = useRef(testId);
  const pdfToastIdRef = useRef<string | number | undefined>(undefined);

  const [pdfConfigOpen, setPdfConfigOpen] = useState(false);

  const {
    status: jobStatus,
    result: jobResult,
    error: jobError,
    startPolling,
    reset: resetJobPolling,
  } = useJobPolling();

  // Reload config from localStorage when navigating to a different test
  useEffect(() => {
    testIdRef.current = testId;
    if (!testId) return;
    try {
      const saved = localStorage.getItem(`pdf_config_${testId}`);
      setPdfConfig(saved ? { ...defaultPdfConfig, ...JSON.parse(saved) } : defaultPdfConfig);
    } catch (e) {
      console.warn("Błąd odczytu konfiguracji PDF z localStorage", e);
      setPdfConfig(defaultPdfConfig);
    }
  }, [testId]);

  // Save config changes using ref so testId changes don't trigger a premature save
  useEffect(() => {
    const tid = testIdRef.current;
    if (!tid) return;
    try {
      localStorage.setItem(`pdf_config_${tid}`, JSON.stringify(pdfConfig));
    } catch (e) {
      console.warn("Błąd zapisu konfiguracji PDF do localStorage", e);
    }
  }, [pdfConfig]);

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

  const downloadCustomPdf = async (targetTestId: number) => {
    if (!targetTestId) return;
    pdfToastIdRef.current = toast.loading("Przygotowuję PDF…");
    try {
      const enqueue = await exportCustomPdf(targetTestId, pdfConfig);
      resetJobPolling();
      startPolling(enqueue.job_id);
    } catch (e: any) {
      toast.error(e.message || "Nie udało się zainicjować eksportu PDF.", {
        id: pdfToastIdRef.current,
      });
      pdfToastIdRef.current = undefined;
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
        toast.error("Brak ścieżki do pliku w wyniku zadania.", { id: pdfToastIdRef.current });
        pdfToastIdRef.current = undefined;
      } else {
        const resolved = resolveUrl(fileUrl);
        downloadFromUrl(resolved, filename)
          .then(() => {
            toast.success("PDF gotowy — pobieranie rozpoczęte.", { id: pdfToastIdRef.current });
            pdfToastIdRef.current = undefined;
          })
          .catch((err) => {
            toast.error(err.message || "Nie udało się pobrać pliku PDF.", { id: pdfToastIdRef.current });
            pdfToastIdRef.current = undefined;
          });
      }
      resetJobPolling();
    } else if (normalized === "failed") {
      toast.error(jobError || (jobResult as any)?.error || "Eksport PDF nie powiódł się.", {
        id: pdfToastIdRef.current,
      });
      pdfToastIdRef.current = undefined;
      resetJobPolling();
    }
  }, [jobStatus, jobResult, jobError, resetJobPolling]);

  return {
    state: {
      pdfConfig,
      pdfConfigOpen,
    },
    actions: {
      setPdfConfigOpen,
      updatePdfConfig,
      resetPdfConfig,
      downloadCustomPdf,
    },
  };
};

export default usePdfConfig;