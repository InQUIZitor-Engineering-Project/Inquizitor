import React from "react";
import { Box, Flex, Stack } from "../../design-system/primitives";
import Footer from "../../components/Footer/Footer";
import ConfirmationModal from "../../components/ConfirmationModal/ConfirmationModal";
import useTestDetail from "./hooks/useTestDetail";
import TitleBar from "./components/TitleBar";
import MetaSummary from "./components/MetaSummary";
import QuestionsSection from "./components/QuestionsSection";
import DownloadActions from "./components/DownloadActions";
import PdfConfigSection from "./components/PdfConfigSection";

const TestDetailPage: React.FC = () => {
  const { state, derived, actions } = useTestDetail();

  if (state.loading) return <div>Ładowanie…</div>;
  if (state.error) return <div>Błąd: {state.error}</div>;
  if (!state.data) return null;

  const { data } = state;

  return (
    <Flex $direction="column" $height="100%" $bg="#f5f6f8" $overflow="hidden">
      <Box $flex={1} $overflowY="auto" $p={40} $width="100%">
        <Stack style={{ maxWidth: 900, margin: "0 auto", width: "100%" }} $gap="lg">
          <TitleBar
            title={data.title}
            isEditing={state.isEditingTitle}
            titleDraft={state.titleDraft}
            onChangeDraft={actions.setTitleDraft}
            onSave={actions.saveTitle}
            onCancel={actions.cancelTitle}
            onBeginEdit={() => actions.beginTitleEdit(data.title)}
            onDelete={() => actions.handleOpenDeleteModal(data.test_id)}
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

          <DownloadActions
            onDownloadPdf={actions.handleDownloadCustomPdf}
            onDownloadXml={actions.downloadXml}
          />

          <PdfConfigSection
            config={state.pdfConfig}
            isOpen={state.pdfConfigOpen}
            onToggle={() => actions.setPdfConfigOpen(!state.pdfConfigOpen)}
            onChange={(updater) => actions.setPdfConfig((cfg) => updater(cfg))}
            onReset={actions.resetPdfConfig}
            onDownload={actions.handleDownloadCustomPdf}
          />

          <Footer />
          {state.testIdToDelete !== null && (
            <ConfirmationModal
              onCancel={actions.handleCloseModal}
              onConfirm={actions.handleConfirmDelete}
            />
          )}
        </Stack>
      </Box>
    </Flex>
  );
};

export default TestDetailPage;
