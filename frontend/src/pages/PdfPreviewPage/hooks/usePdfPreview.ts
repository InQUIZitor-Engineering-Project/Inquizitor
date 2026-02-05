import { useState } from "react";
import useTestData from "../../TestDetailPage/hooks/useTestData";
import usePdfConfig from "../../TestDetailPage/hooks/usePdfConfig";
import type { PdfExportConfig } from "../../../services/test";

export interface UsePdfPreviewResult {
  state: {
    data: ReturnType<typeof useTestData>["data"];
    loading: boolean;
    error: string | null;
    pdfConfig: PdfExportConfig;
    pdfConfigValid: boolean;
    downloadError: string | null;
  };
  actions: {
    setPdfConfig: (updater: (cfg: PdfExportConfig) => PdfExportConfig) => void;
    resetPdfConfig: () => void;
    setPdfConfigValid: (valid: boolean) => void;
    handleDownloadCustomPdf: () => Promise<void>;
    clearDownloadError: () => void;
  };
}

const usePdfPreview = (): UsePdfPreviewResult => {
  const { data, loading, error } = useTestData();
  const { state: pdfState, actions: pdfActions } = usePdfConfig();
  const [pdfConfigValid, setPdfConfigValid] = useState(true);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownloadCustomPdf = async () => {
    if (!data?.test_id) return;
    setDownloadError(null);
    if (!pdfConfigValid) {
      setDownloadError("Ustaw poprawną wysokość pola odpowiedzi (1–10 cm), aby pobrać PDF.");
      return;
    }
    try {
      await pdfActions.downloadCustomPdf(data.test_id);
    } catch (err: any) {
      setDownloadError(err.message || "Nie udało się pobrać pliku PDF.");
    }
  };

  const clearDownloadError = () => {
    setDownloadError(null);
  };

  return {
    state: {
      data,
      loading,
      error,
      pdfConfig: pdfState.pdfConfig,
      pdfConfigValid,
      downloadError,
    },
    actions: {
      setPdfConfig: pdfActions.updatePdfConfig,
      resetPdfConfig: pdfActions.resetPdfConfig,
      setPdfConfigValid,
      handleDownloadCustomPdf,
      clearDownloadError,
    },
  };
};

export default usePdfPreview;

