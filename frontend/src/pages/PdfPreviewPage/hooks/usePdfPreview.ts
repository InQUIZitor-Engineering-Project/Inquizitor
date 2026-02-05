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
  };
  actions: {
    setPdfConfig: (updater: (cfg: PdfExportConfig) => PdfExportConfig) => void;
    resetPdfConfig: () => void;
    setPdfConfigValid: (valid: boolean) => void;
    handleDownloadCustomPdf: () => Promise<void>;
  };
}

const usePdfPreview = (): UsePdfPreviewResult => {
  const { data, loading, error } = useTestData();
  const { state: pdfState, actions: pdfActions } = usePdfConfig();
  const [pdfConfigValid, setPdfConfigValid] = useState(true);

  const handleDownloadCustomPdf = async () => {
    if (!data?.test_id) return;
    if (!pdfConfigValid) {
      alert("Ustaw poprawną wysokość pola odpowiedzi (1–10 cm), aby pobrać PDF.");
      return;
    }
    await pdfActions.downloadCustomPdf(data.test_id);
  };

  return {
    state: {
      data,
      loading,
      error,
      pdfConfig: pdfState.pdfConfig,
      pdfConfigValid,
    },
    actions: {
      setPdfConfig: pdfActions.updatePdfConfig,
      resetPdfConfig: pdfActions.resetPdfConfig,
      setPdfConfigValid,
      handleDownloadCustomPdf,
    },
  };
};

export default usePdfPreview;

