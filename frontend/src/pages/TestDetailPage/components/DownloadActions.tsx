import React from "react";
import { Flex, Button } from "../../../design-system/primitives";
import { AlertBar } from "../../../design-system/patterns";

export interface DownloadActionsProps {
  onDownloadPdf: () => void;
  onDownloadXml: () => void;
}

const DownloadActions: React.FC<DownloadActionsProps> = ({ onDownloadPdf, onDownloadXml }) => {
  return (
    <Flex $gap="sm" $mt="lg" $align="center" $wrap="wrap">
      <Button onClick={onDownloadPdf}>Pobierz PDF</Button>
      <Button onClick={onDownloadXml}>Pobierz XML</Button>
      <AlertBar variant="warning">
        Test został wygenerowany przez AI i może zawierać błędy. Zweryfikuj go przed pobraniem.
      </AlertBar>
    </Flex>
  );
};

export default DownloadActions;
