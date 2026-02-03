import React from "react";
import { Flex, Button, Text, Box } from "../../../design-system/primitives";
import { AlertBar } from "../../../design-system/patterns";

export interface DownloadPDFProps {
  onDownloadPdf: () => void;
  pdfDisabled?: boolean;
  pdfDisabledReason?: string;
}

const DownloadPDF: React.FC<DownloadPDFProps> = ({
  onDownloadPdf,
  pdfDisabled,
  pdfDisabledReason,
}) => {
  return (
    <Flex $gap="sm" $mt="lg" $direction="column">
      
      <Button 
        onClick={onDownloadPdf} 
        disabled={pdfDisabled} 
        $fullWidth
        $size="lg"
      >
        Pobierz PDF
      </Button>

      <Box $px="xs">
        <Text 
          $variant="body3"
          $tone="muted" 
          style={{ fontSize: "12px", lineHeight: "1.4", textAlign: "center", display: "block" }}
        >
          To jest podgląd. Finalny plik PDF może nieznacznie różnić się układem oraz czcionkami.
        </Text>
      </Box>

      {pdfDisabled && pdfDisabledReason && (
        <AlertBar variant="danger">{pdfDisabledReason}</AlertBar>
      )}
    </Flex>
  );
};

export default DownloadPDF;