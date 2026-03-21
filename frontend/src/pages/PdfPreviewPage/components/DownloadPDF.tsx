import React from "react";
import { Flex, Button, Text } from "../../../design-system/primitives";

export interface DownloadPDFProps {
  onDownloadPdf: () => void;
  pdfDisabled?: boolean;
}

const DownloadPDF: React.FC<DownloadPDFProps> = ({ onDownloadPdf, pdfDisabled }) => {
  return (
    <Flex $gap="sm" $direction="column">
      <Button
        onClick={onDownloadPdf}
        disabled={pdfDisabled}
        $fullWidth
        $size="lg"
      >
        Pobierz PDF
      </Button>
      <Text
        $variant="body3"
        $tone="muted"
        style={{ fontSize: "12px", lineHeight: "1.4", textAlign: "center", display: "block" }}
      >
        Finalny plik może nieznacznie różnić się od podglądu.
      </Text>
    </Flex>
  );
};

export default DownloadPDF;
