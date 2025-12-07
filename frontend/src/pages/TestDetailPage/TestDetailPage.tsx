import React from "react";
import { Box, Flex, Stack, Button } from "../../design-system/primitives";
import Footer from "../../components/Footer/Footer";
import useTestDetail from "./hooks/useTestDetail";
import TitleBar from "./components/TitleBar";
import MetaSummary from "./components/MetaSummary";
import QuestionsSection from "./components/QuestionsSection";
import PdfConfigSection from "./components/PdfConfigSection";
import { AlertBar } from "../../design-system/patterns";
import { PageContainer, PageSection } from "../../design-system/patterns";

const TestDetailPage: React.FC = () => {
  const { state, derived, actions } = useTestDetail();

  if (state.loading) return <div>Ładowanie…</div>;
  if (state.error) return <div>Błąd: {state.error}</div>;
  if (!state.data) return null;

  const { data } = state;

  return (
    <Flex $direction="column" $height="100%" $bg="#f5f6f8" $overflow="hidden">
      <Box $flex={1} $overflowY="auto" $width="100%">
        <PageSection $py="xl">
          <PageContainer>
            <Stack style={{ width: "100%", maxWidth: 960, margin: "0 auto" }} $gap="lg">
              <TitleBar
                title={data.title}
                isEditing={state.isEditingTitle}
                titleDraft={state.titleDraft}
                onChangeDraft={actions.setTitleDraft}
                onSave={actions.saveTitle}
                onCancel={actions.cancelTitle}
                onBeginEdit={() => actions.beginTitleEdit(data.title)}
              />

              <MetaSummary
                total={data.questions.length}
                easy={data.questions.filter((q) => q.difficulty === 1).length}
                medium={data.questions.filter((q) => q.difficulty === 2).length}
                hard={data.questions.filter((q) => q.difficulty === 3).length}
                closedCount={derived.closedCount}
                openCount={derived.openCount}
              />

              <QuestionsSection
                questions={data.questions}
                editingId={state.editingId}
                isAdding={state.isAdding}
                draft={state.draft}
                actions={{
                  startEdit: actions.startEdit,
                  startAdd: actions.startAdd,
                  cancelEdit: actions.cancelEdit,
                  handleSaveEdit: actions.handleSaveEdit,
                  handleAdd: actions.handleAdd,
                  handleDelete: actions.handleDelete,
                  toggleDraftClosed: actions.toggleDraftClosed,
                  setDraftDifficulty: actions.setDraftDifficulty,
                  onTextChange: actions.onTextChange,
                  updateDraftChoice: actions.updateDraftChoice,
                  toggleDraftCorrect: actions.toggleDraftCorrect,
                  removeChoiceRow: actions.removeChoiceRow,
                  addDraftChoiceRow: actions.addDraftChoiceRow,
                }}
                stateFlags={{
                  savingEdit: state.savingEdit,
                  savingAdd: state.savingAdd,
                  editorError: state.editorError,
                  missingCorrectLive: derived.missingCorrectLive,
                  ensureChoices: derived.ensureChoices,
                }}
              />

              <PdfConfigSection
                config={state.pdfConfig}
                isOpen={state.pdfConfigOpen}
                onToggle={() => actions.setPdfConfigOpen(!state.pdfConfigOpen)}
                onChange={(updater) => actions.setPdfConfig((cfg) => updater(cfg))}
                onReset={actions.resetPdfConfig}
              />

              <Box>
                <Flex $gap="sm" $align="center" $wrap="wrap" $mt="sm">
                  <Button onClick={actions.handleDownloadCustomPdf}>Pobierz PDF</Button>
                  <Button onClick={actions.downloadXml}>Pobierz XML</Button>
                  <AlertBar variant="warning">
                    Test został wygenerowany przez AI i może zawierać błędy. Zweryfikuj go przed pobraniem.
                  </AlertBar>
                </Flex>
              </Box>

              <Footer />
              {/* Usunięto przycisk "Usuń test" – modal nieużywany */}
            </Stack>
          </PageContainer>
        </PageSection>
      </Box>
    </Flex>
  );
};

export default TestDetailPage;
