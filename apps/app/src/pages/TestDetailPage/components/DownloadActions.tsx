import React from "react";
import { Flex, Button } from "../../../design-system/primitives";
import { AlertBar } from "../../../design-system/patterns";

export interface DownloadActionsProps {
  onDownloadPdf: () => void;
  onDownloadXml: () => void;
  pdfDisabled?: boolean;
  pdfDisabledReason?: string;
}

const DownloadActions: React.FC<DownloadActionsProps> = ({
  onDownloadPdf,
  onDownloadXml,
  pdfDisabled,
  pdfDisabledReason,
}) => {
  return (
    <Flex $gap="sm" $mt="lg" $align="center" $wrap="wrap">
      <Button onClick={onDownloadPdf} disabled={pdfDisabled}>Pobierz PDF</Button>
      <Button onClick={onDownloadXml}>Pobierz XML</Button>
      {pdfDisabled && pdfDisabledReason && (
        <AlertBar variant="danger">{pdfDisabledReason}</AlertBar>
      )}
      <AlertBar variant="warning">
        AI może generować błędne treści. Zweryfikuj test przed pobraniem.
      </AlertBar>
    </Flex>
  );
};

export default DownloadActions;
