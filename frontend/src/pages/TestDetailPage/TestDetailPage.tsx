import React from "react";
import { Box, Flex, Stack, Text, Textarea } from "../../design-system/primitives";
import useTestDetail from "./hooks/useTestDetail";
import TitleBar from "./components/TitleBar";
import QuestionsSection from "./components/QuestionsSection";
import PdfConfigSection from "./components/PdfConfigSection";
import BulkActionBar from "./components/BulkActionBar";
import { Modal } from "../../design-system/patterns";
import { SelectableItem } from "../../design-system/patterns/Modal";
import { PageContainer, PageSection } from "../../design-system/patterns";
import DownloadActions from "./components/DownloadActions"

const TestDetailPage: React.FC = () => {
  const { state, derived, actions } = useTestDetail();

  if (state.loading) return <div>Ładowanie…</div>;
  if (state.error) return <div>Błąd: {state.error}</div>;
  if (!state.data) return null;

  const { data } = state;
  
  return (
    <Flex $direction="column" $height="100%" $bg="#f5f6f8" style={{ position: "relative" }}>
      <Box $flex={1} $width="100%">
        <PageSection $py="xl">
          <PageContainer>
            <Stack style={{ width: "100%", maxWidth: 960, margin: "0 auto" }} $gap="3xl">
              <TitleBar
                title={data.title}
                isEditing={state.isEditingTitle}
                titleDraft={state.titleDraft}
                onChangeDraft={actions.setTitleDraft}
                onSave={actions.saveTitle}
                onCancel={actions.cancelTitle}
                onBeginEdit={() => actions.beginTitleEdit(data.title)}
                onEditConfig={actions.handleEditConfig}
              />

              <Stack $gap="lg">
                <QuestionsSection
                  questions={data.questions}
                  editingId={state.editingId}
                  isAdding={state.isAdding}
                  draft={state.draft}
                  selectedIds={state.selectedIds}
                  summary={{
                    total: data.questions.length,
                    easy: data.questions.filter((q) => q.difficulty === 1).length,
                    medium: data.questions.filter((q) => q.difficulty === 2).length,
                    hard: data.questions.filter((q) => q.difficulty === 3).length,
                  }}
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
                    toggleSelect: actions.toggleSelect,
                    selectAll: actions.selectAll,
                    clearSelection: actions.clearSelection,
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
                  onValidityChange={actions.setPdfConfigValid}
                />

                <DownloadActions 
                  onDownloadPdf={actions.handleDownloadCustomPdf}
                  onDownloadXml={actions.downloadXml}
                  pdfDisabled={!state.pdfConfigValid}
                  pdfDisabledReason="Ustaw poprawną wysokość pola odpowiedzi (1–10 cm), aby pobrać PDF."
                />
              </Stack>
            </Stack>
          </PageContainer>
        </PageSection>
        {state.questionIdToDelete !== null && (
          <Modal
            isOpen={true}
            title="Usuń pytanie"
            onClose={actions.closeQuestionDeleteModal}
            onConfirm={actions.confirmQuestionDelete}
            variant="danger"
            confirmLabel="Usuń"
          >
            Czy na pewno chcesz usunąć to pytanie? Tej operacji nie można cofnąć.
          </Modal>
        )}
      </Box>

      <Modal
        isOpen={state.isRegenerateModalOpen}
        title="✨ Regeneruj pytania z AI"
        onClose={actions.closeRegenerateModal}
        onConfirm={actions.handleBulkRegenerate}
        variant="info"
        confirmLabel="Regeneruj"
        cancelLabel="Anuluj"
      >
        <Stack $gap="md">
          <Text>
            Czy na pewno chcesz wygenerować nowe wersje dla zaznaczonych pytań? 
            Obecna treść zostanie zastąpiona nowymi wariantami.
          </Text>
          <Stack $gap="xs">
            <Text $variant="body2" $weight="medium">Na czym AI ma się skupić? (opcjonalnie):</Text>
            <Textarea 
              placeholder="np. skup się na teorii, uprość język, zmień liczby w zadaniach, dodaj więcej podtekstu historycznego..."
              value={state.regenerationInstruction}
              onChange={(e) => actions.setRegenerationInstruction(e.target.value)}
              $fullWidth
              $minHeight="100px"
              className="ph-no-capture"
            />
          </Stack>
        </Stack>
      </Modal>

      <Modal
        isOpen={state.isDifficultyModalOpen}
        title="Zmień poziom trudności"
        onClose={actions.closeDifficultyModal}
        onConfirm={() => state.tempDifficulty && actions.handleBulkUpdate({ difficulty: state.tempDifficulty })}
        confirmLabel="Zastosuj"
        variant="brand"
      >
        <Stack $gap="sm">
          <Text $variant="body3" $tone="muted" style={{ marginBottom: 8 }}>
            Wybierz poziom trudności dla zaznaczonych pytań:
          </Text>
          <SelectableItem
            $active={state.tempDifficulty === 1}
            onClick={() => actions.setTempDifficulty(1)}
            $align="center"
            $gap="sm"
          >
            <Text $variant="body2" $weight="medium">Łatwe</Text>
          </SelectableItem>
          <SelectableItem
            $active={state.tempDifficulty === 2}
            onClick={() => actions.setTempDifficulty(2)}
            $align="center"
            $gap="sm"
          >
            <Text $variant="body2" $weight="medium">Średnie</Text>
          </SelectableItem>
          <SelectableItem
            $active={state.tempDifficulty === 3}
            onClick={() => actions.setTempDifficulty(3)}
            $align="center"
            $gap="sm"
          >
            <Text $variant="body2" $weight="medium">Trudne</Text>
          </SelectableItem>
        </Stack>
      </Modal>

      <Modal
        isOpen={state.isTypeModalOpen}
        title="🔄 Zmień typ pytań"
        onClose={actions.closeTypeModal}
        onConfirm={() => state.tempType && actions.handleBulkTypeChange(state.tempType)}
        confirmLabel="Zastosuj"
        variant="brand"
      >
        <Stack $gap="sm">
          <Text $variant="body3" $tone="muted" style={{ marginBottom: 8 }}>
            Na jaki typ chcesz zmienić zaznaczone pytania?
          </Text>
          <SelectableItem
            $active={state.tempType === "open"}
            onClick={() => actions.setTempType("open")}
            $align="center"
            $gap="sm"
          >
            <Stack $gap="xs">
              <Text $variant="body2" $weight="medium">Otwarte</Text>
              <Text $variant="body3" $tone="muted">AI przeredaguje treść pytania, usuwając kontekst opcji wyboru.</Text>
            </Stack>
          </SelectableItem>
          <SelectableItem
            $active={state.tempType === "closed"}
            onClick={() => actions.setTempType("closed")}
            $align="center"
            $gap="sm"
          >
            <Stack $gap="xs">
              <Text $variant="body2" $weight="medium">Zamknięte</Text>
              <Text $variant="body3" $tone="muted">AI dostosuje treść pytania i wygeneruje 4 opcje wyboru.</Text>
            </Stack>
          </SelectableItem>
        </Stack>
      </Modal>

      <Modal
        isOpen={state.isBulkDeleteModalOpen}
        title="Usuń zaznaczone pytania"
        onClose={actions.closeBulkDeleteModal}
        onConfirm={actions.handleBulkDelete}
        variant="danger"
        confirmLabel="Usuń"
        cancelLabel="Anuluj"
      >
        <Text>
          Czy na pewno chcesz usunąć zaznaczone pytania? Tej operacji nie można cofnąć.
        </Text>
      </Modal>

      <BulkActionBar
        selectedCount={state.selectedIds.length}
        onDelete={actions.openBulkDeleteModal}
        onOpenDifficulty={actions.openDifficultyModal}
        onOpenTypeChange={actions.openTypeModal}
        onRegenerate={actions.openRegenerateModal}
        onClear={actions.clearSelection}
        isMenuOpen={state.isMobileMenuOpen}
        onOpenMenu={actions.openMobileMenu}
        onCloseMenu={actions.closeMobileMenu}
      />
    </Flex>
  );
};

export default TestDetailPage;
