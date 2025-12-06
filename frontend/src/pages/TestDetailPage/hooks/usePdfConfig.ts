import { useState } from "react";
import type { PdfExportConfig } from "../../../services/test";
import { exportCustomPdf } from "../../../services/test";
import { useLoader } from "../../../components/Loader/GlobalLoader";

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
  };
  actions: {
    setPdfConfigOpen: (next: boolean) => void;
    updatePdfConfig: (updater: (cfg: PdfExportConfig) => PdfExportConfig) => void;
    resetPdfConfig: () => void;
    downloadCustomPdf: (testId: number) => Promise<void>;
  };
}

const usePdfConfig = () => {
  const { withLoader } = useLoader();
  const [pdfConfig, setPdfConfig] = useState<PdfExportConfig>(defaultPdfConfig);
  const [pdfConfigOpen, setPdfConfigOpen] = useState(false);

  const updatePdfConfig = (updater: (cfg: PdfExportConfig) => PdfExportConfig) => {
    setPdfConfig((cfg) => updater(cfg));
  };

  const resetPdfConfig = () => {
    setPdfConfig(defaultPdfConfig);
  };

  const downloadCustomPdf = async (testId: number) => {
    if (!testId) return;
    await withLoader(async () => {
      try {
        const blob = await exportCustomPdf(testId, pdfConfig);
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `test_${testId}_custom.pdf`;
        a.click();
        URL.revokeObjectURL(a.href);
      } catch (e: any) {
        alert(e.message || "Nie udało się wyeksportować spersonalizowanego PDF.");
      }
    });
  };

  return {
    state: { pdfConfig, pdfConfigOpen },
    actions: { setPdfConfigOpen, updatePdfConfig, resetPdfConfig, downloadCustomPdf },
  };
};

export default usePdfConfig;
