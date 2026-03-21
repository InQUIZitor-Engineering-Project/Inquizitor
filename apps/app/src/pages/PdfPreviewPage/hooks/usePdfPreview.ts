import useTestData from "../../TestDetailPage/hooks/useTestData";
import usePdfConfig from "../../TestDetailPage/hooks/usePdfConfig";
import type { PdfExportConfig } from "../../../services/test";
import { useState } from "react";

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

  const handleDownloadCustomPdf = async () => {
    if (!data?.test_id) return;
    pdfActions.clearExportError();
    if (!pdfConfigValid) return;
    await pdfActions.downloadCustomPdf(data.test_id);
  };

  return {
    state: {
      data,
      loading,
      error,
      pdfConfig: pdfState.pdfConfig,
      pdfConfigValid,
      downloadError: pdfState.exportError,
    },
    actions: {
      setPdfConfig: pdfActions.updatePdfConfig,
      resetPdfConfig: pdfActions.resetPdfConfig,
      setPdfConfigValid,
      handleDownloadCustomPdf,
      clearDownloadError: pdfActions.clearExportError,
    },
  };
};

export default usePdfPreview;
