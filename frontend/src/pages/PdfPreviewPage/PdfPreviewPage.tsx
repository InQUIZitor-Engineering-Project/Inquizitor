import React, { useEffect } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { Box, Flex, Stack, Text, Heading, Button, Divider } from "../../design-system/primitives";
import { AlertBar } from "../../design-system/patterns";
import usePdfPreview from "./hooks/usePdfPreview";
import ConfigSection from "./components/ConfigSection";
import DownloadPDF from "./components/DownloadPDF";
import LiveTestPreview from "./components/LiveTestPreview";

const BackLink = styled.button`
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.neutral.grey};
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: color 0.15s ease;

  &:hover {
    color: ${({ theme }) => theme.colors.neutral.dGrey};
  }
`;

const NAVBAR_HEIGHT = "65px";

const PdfPreviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, actions } = usePdfPreview();

  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  if (state.loading) return <Box $p="xl">Ładowanie podglądu…</Box>;
  if (state.error) return <Box $p="xl">Błąd: {state.error}</Box>;
  if (!state.data) return null;

  return (
    <Box
      style={{
        position: "fixed",
        top: NAVBAR_HEIGHT,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "#f5f6f8",
        display: "flex",
        overflow: "hidden",
      }}
    >
      {/* Sidebar */}
      <Box
        style={{
          width: 420,
          flexShrink: 0,
          background: "white",
          borderRight: "1px solid #e8e8e8",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          zIndex: 10,
        }}
      >
        {/* Header */}
        <Box
          $px="lg"
          $pt="lg"
          $pb="md"
          style={{ borderBottom: "1px solid #f0f0f0", flexShrink: 0 }}
        >
          <BackLink onClick={() => navigate(`/tests/${state.data?.test_id}`)}>
            ← Wróć do edycji
          </BackLink>
          <Box $mt="sm">
            <Heading as="h2" $level="h3" style={{ lineHeight: 1.2 }}>
              {state.data.title}
            </Heading>
            <Text $variant="body3" $tone="muted" style={{ marginTop: 4 }}>
              Konfiguracja wydruku PDF
            </Text>
          </Box>
        </Box>

        {/* Scrollable config area */}
        <Box style={{ flex: 1, overflowY: "auto", padding: "20px 20px 8px" }}>
          <ConfigSection
            config={state.pdfConfig}
            onChange={(updater) => actions.setPdfConfig((cfg) => updater(cfg))}
            onValidityChange={actions.setPdfConfigValid}
          />
        </Box>

        {/* Footer */}
        <Box
          $px="lg"
          $pt="md"
          $pb="lg"
          style={{ borderTop: "1px solid #f0f0f0", flexShrink: 0 }}
        >
          <Stack $gap="sm">
            {state.downloadError && (
              <AlertBar variant="danger">{state.downloadError}</AlertBar>
            )}
            <DownloadPDF
              onDownloadPdf={actions.handleDownloadCustomPdf}
              pdfDisabled={!state.pdfConfigValid}
            />
            <Divider />
            <Button
              $variant="ghost"
              $size="sm"
              $fullWidth
              onClick={actions.resetPdfConfig}
            >
              Przywróć ustawienia domyślne
            </Button>
          </Stack>
        </Box>
      </Box>

      {/* Preview area */}
      <Box
        style={{
          flex: 1,
          background: "#525659",
          overflowY: "auto",
          padding: "32px",
          position: "relative",
          height: "100%",
        }}
      >
        <Flex $justify="center" $align="flex-start" style={{ minHeight: "100%" }}>
          <LiveTestPreview data={state.data} config={state.pdfConfig} />
        </Flex>
      </Box>
    </Box>
  );
};

export default PdfPreviewPage;
