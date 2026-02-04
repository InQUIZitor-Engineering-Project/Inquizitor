import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import { Box, Flex, Stack, Text, Button } from "../../design-system/primitives";
import useTestDetail from "../TestDetailPage/hooks/useTestDetail"; 
import ConfigSection from "./components/ConfigSection"; 
import DownloadActions from "./components/DownloadActions";
import LiveTestPreview from "./components/LiveTestPreview"; 
import { MathJaxContext } from "better-react-mathjax";

const mathJaxConfig = {
  loader: { load: ["input/tex", "output/chtml"] },
  tex: {
    inlineMath: [["$", "$"], ["\\(", "\\)"]],
    displayMath: [["$$", "$$"], ["\\[", "\\]"]],
    packages: { "[+]": ["noerrors", "noundefined"] }
  },
  chtml: {
    scale: 1.0,
    displayAlign: 'center' 
  }
};

const PdfPreviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, actions } = useTestDetail();

  const NAVBAR_HEIGHT = "65px"; 

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
    <MathJaxContext config={mathJaxConfig} src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js">
      <Box 
        style={{
          position: "fixed",
          top: NAVBAR_HEIGHT,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "#f5f6f8",
          display: "flex",
          overflow: "hidden"
        }}
      >
        
        <Box 
          $width="500px" 
          $bg="white" 
          style={{ 
            borderRight: "1px solid #e0e0e0", 
            display: "flex", 
            flexDirection: "column",
            height: "100%",          
            zIndex: 10 
          }}
        >
          <Box $p="lg" style={{ borderBottom: "1px solid #eee", flexShrink: 0 }}>
            <Stack $gap="md">
              <Box>
                <Text $variant="body2" $tone="muted">{state.data.title}</Text>
                <Text $variant="body1" $weight="medium">Podgląd i konfiguracja testu</Text>
              </Box>
              <Button 
                onClick={() => navigate(`/tests/${state.data?.test_id}`)} 
                $variant="info"
                $size="sm"
              >
                ← Wróć do edycji
              </Button>
            </Stack>
          </Box>

          <Box $flex={1} $overflow="auto" $p="lg">
            <ConfigSection
              config={state.pdfConfig}
              onChange={(updater) => actions.setPdfConfig((cfg) => updater(cfg))}
              onReset={actions.resetPdfConfig}
              onValidityChange={actions.setPdfConfigValid}
            />
          </Box>
          
          <Box $p="lg" $bg="#fafafa" style={{ borderTop: "1px solid #eee", flexShrink: 0 }}>
             <DownloadActions 
                onDownloadPdf={actions.handleDownloadCustomPdf}
                pdfDisabled={!state.pdfConfigValid}
                pdfDisabledReason="Popraw błędy w konfiguracji powyżej."
             />
          </Box>
        </Box>

        <Box 
          $flex={1} 
          $bg="#525659" 
          $overflow="auto" 
          $p="2xl" 
          style={{ position: "relative", height: "100%" }}
        >
          <Flex $justify="center" $align="flex-start" $minHeight="100%">
            <Box>
              <LiveTestPreview 
                key={JSON.stringify(state.pdfConfig)}
                data={state.data} 
                config={state.pdfConfig} 
              />
            </Box>
          </Flex>
        </Box>

      </Box>
    </MathJaxContext>
  );
};

export default PdfPreviewPage;