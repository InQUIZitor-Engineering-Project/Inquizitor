import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import styled, { useTheme } from "styled-components";
import { Box, Button, Flex, Input, Stack, Text, Textarea } from "../../design-system/primitives";
import useTestDetail from "./hooks/useTestDetail";
import { useAuth } from "../../hooks/useAuth";
import TitleBar from "./components/TitleBar";
import GroupTabs from "./components/GroupTabs";
import type { GroupTabItem } from "./components/GroupTabs";
import QuestionsSection from "./components/QuestionsSection";
import PdfConfigSection from "./components/PdfConfigSection";
import BulkActionBar from "./components/BulkActionBar";
import { Modal, AlertBar } from "../../design-system/patterns";
import { SelectableItem } from "../../design-system/patterns/Modal";
import { PageContainer, PageSection } from "../../design-system/patterns";
import DownloadActions from "./components/DownloadActions"

const GENERATING_VARIANT_TAB_ID = "generating-variant";

const VariantLoadingSpinner = styled(Box).attrs({ as: "span" })`
  display: inline-flex;
  width: 48px;
  height: 48px;
  animation: variant-spin 0.8s linear infinite;
  @keyframes variant-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const TestDetailPage: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { state, derived, actions } = useTestDetail();
  const isConsentRevoked = Boolean(user && !user.terms_accepted);
  const [activeGroupId, setActiveGroupId] = useState<string>("");
  const [generatingVariantLabel, setGeneratingVariantLabel] = useState<string | null>(null);
  const [renameGroupId, setRenameGroupId] = useState<string | null>(null);
  const [renameGroupLabel, setRenameGroupLabel] = useState("");
  const [groupIdToDelete, setGroupIdToDelete] = useState<string | null>(null);

  const groupsFromApi: GroupTabItem[] = useMemo(() => {
    const gs = state.data?.groups ?? [];
    return gs.map((g) => ({ id: String(g.id), label: g.label }));
  }, [state.data?.groups]);

  const groups: GroupTabItem[] = useMemo(() => {
    if (!generatingVariantLabel) return groupsFromApi;
    return [
      ...groupsFromApi,
      { id: GENERATING_VARIANT_TAB_ID, label: generatingVariantLabel, loading: true },
    ];
  }, [groupsFromApi, generatingVariantLabel]);

  useEffect(() => {
    if (!state.data?.groups?.length) return;
    const firstId = String(state.data.groups[0].id);
    setActiveGroupId((prev) => (prev && groups.some((g) => g.id === prev) ? prev : firstId));
  }, [state.data?.groups, groups]);

  const questionsForActiveGroup = useMemo(() => {
    if (!state.data?.questions || !activeGroupId || activeGroupId === GENERATING_VARIANT_TAB_ID)
      return [];
    const gid = Number(activeGroupId);
    return state.data.questions.filter((q) => q.group_id === gid);
  }, [state.data?.questions, activeGroupId]);

  const isGeneratingVariant = activeGroupId === GENERATING_VARIANT_TAB_ID;

  const handleAddGroup = async () => {
    if (!state.data || (state.data.groups?.length ?? 0) >= 5) return;
    const nextLetter = String.fromCharCode(65 + groups.length);
    const newGroup = await actions.createGroup(state.data.test_id, `Grupa ${nextLetter}`);
    if (newGroup) {
      setActiveGroupId(String(newGroup.id));
      actions.startAdd();
    }
  };

  const openRenameGroupModal = (id: string) => {
    const group = groups.find((g) => g.id === id);
    if (!group) return;
    setRenameGroupId(id);
    setRenameGroupLabel(group.label);
  };

  const closeRenameGroupModal = () => {
    setRenameGroupId(null);
    setRenameGroupLabel("");
  };

  const handleRenameGroupSave = async () => {
    const trimmed = renameGroupLabel.trim();
    if (!trimmed || !renameGroupId || !state.data) return;
    await actions.updateGroup(state.data.test_id, Number(renameGroupId), trimmed);
    closeRenameGroupModal();
  };

  const openRemoveGroupModal = (id: string) => {
    if (groups.length <= 1) return;
    setGroupIdToDelete(id);
  };

  const closeRemoveGroupModal = () => setGroupIdToDelete(null);

  const handleConfirmRemoveGroup = async () => {
    if (!groupIdToDelete || !state.data) return;
    const nextGroups = groups.filter((g) => g.id !== groupIdToDelete);
    if (activeGroupId === groupIdToDelete) {
      setActiveGroupId(nextGroups[0]?.id ?? "");
    }
    await actions.deleteGroup(state.data.test_id, Number(groupIdToDelete));
    closeRemoveGroupModal();
  };

  const handleDuplicateCurrentGroup = async () => {
    if (!state.data || !activeGroupId) return;
    const newGroup = await actions.duplicateGroup(state.data.test_id, Number(activeGroupId));
    if (newGroup) {
      actions.cancelEdit();
      setActiveGroupId(String(newGroup.id));
    }
  };

  const handleAddShuffledVariant = async () => {
    if (!state.data || !activeGroupId || activeGroupId === GENERATING_VARIANT_TAB_ID) return;
    const newGroup = await actions.createShuffledVariantGroup(
      state.data.test_id,
      Number(activeGroupId)
    );
    if (newGroup) {
      actions.cancelEdit();
      setActiveGroupId(String(newGroup.id));
    }
  };

  const handleGenerateAIVariant = () => {
    if (!activeGroupId || !state.data?.groups) return;
    const sourceGroupId = activeGroupId;
    const nextLetter = String.fromCharCode(65 + groupsFromApi.length);
    const nextLabel = `Grupa ${nextLetter}`;
    setGeneratingVariantLabel(nextLabel);
    setActiveGroupId(GENERATING_VARIANT_TAB_ID);
    actions.handleGenerateAIVariant(Number(sourceGroupId), (newGroupId) => {
      setActiveGroupId(String(newGroupId));
      setGeneratingVariantLabel(null);
    });
  };

  const handleReorderQuestions = async (reorderedActiveIds: number[]) => {
    if (!state.data?.questions || !state.data?.groups || !actions.onReorderQuestions) return;
    const groupsOrdered = [...state.data.groups].sort((a, b) => a.position - b.position);
    const activeGid = Number(activeGroupId);
    const fullOrder: number[] = [];
    for (const g of groupsOrdered) {
      if (g.id === activeGid) {
        fullOrder.push(...reorderedActiveIds);
      } else {
        const ids = state.data!.questions
          .filter((q) => q.group_id === g.id)
          .map((q) => q.id);
        fullOrder.push(...ids);
      }
    }
    await actions.onReorderQuestions(fullOrder);
  };

  if (state.loading) return <div>Ładowanie…</div>;
  if (state.error) return <div>Błąd: {state.error}</div>;
  if (!state.data) return null;

  const { data } = state;

  return (
    <Flex $direction="column" $height="100%" $bg="transparent" style={{ position: "relative" }}>
      <Box $flex={1} $width="100%">
        <PageSection $py="xl">
          <PageContainer>
            <Stack style={{ width: "100%", maxWidth: 960, margin: "0 auto" }} $gap="lg">
              <Box $mb="xl">
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
              </Box>

              <Stack $gap="lg">
                {isConsentRevoked && (
                  <AlertBar variant="danger">
                    <Flex $align="center" $gap="xs" $wrap="wrap">
                      <Text $variant="body2">
                        Nie zaakceptowałeś regulaminu. Funkcje AI (regeneracja pytań, wariant AI, zmiana typu) są wyłączone.
                      </Text>
                      <Link to="/settings" style={{ fontWeight: "bold", textDecoration: "underline", color: "inherit" }}>
                        Przejdź do ustawień, aby zaakceptować regulamin.
                      </Link>
                    </Flex>
                  </AlertBar>
                )}
                <GroupTabs
                  groups={groups}
                  activeGroupId={activeGroupId}
                  onGroupChange={setActiveGroupId}
                  onAddGroup={handleAddGroup}
                  onDuplicateCurrentGroup={handleDuplicateCurrentGroup}
                  onGenerateAIVariant={isConsentRevoked ? undefined : handleGenerateAIVariant}
                  onAddShuffledVariant={handleAddShuffledVariant}
                onRenameGroup={openRenameGroupModal}
                  onRemoveGroup={openRemoveGroupModal}
                  canAddGroup={(state.data?.groups?.length ?? 0) < 5}
                  canRemoveGroup={(state.data?.groups?.length ?? 0) > 1}
                />

                <Stack $gap="lg">
                {isGeneratingVariant ? (
                  <Flex
                    $direction="column"
                    $align="center"
                    $justify="center"
                    $gap="md"
                    style={{
                      minHeight: 220,
                      background: theme.colors.neutral.white,
                      borderRadius: theme.radii.md,
                      padding: theme.spacing["2xl"],
                    }}
                  >
                    <VariantLoadingSpinner aria-hidden>
                      <svg
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={theme.colors.brand.primary}
                        strokeWidth="2"
                        strokeLinecap="round"
                      >
                        <path d="M21 12a9 9 0 1 1-6.22-8.56" />
                      </svg>
                    </VariantLoadingSpinner>
                    <Text $weight="medium" $variant="body2">
                      Trwa generowanie wariantu AI…
                    </Text>
                    <Text $variant="body3" $tone="muted">
                      Nowa grupa z wariantami pytań pojawi się za chwilę.
                    </Text>
                  </Flex>
                ) : (
                <QuestionsSection
                  questions={questionsForActiveGroup}
                  editingId={state.editingId}
                  isAdding={state.isAdding}
                  draft={state.draft}
                  selectedIds={state.selectedIds}
                  summary={{
                    total: questionsForActiveGroup.length,
                    easy: questionsForActiveGroup.filter((q) => q.difficulty === 1).length,
                    medium: questionsForActiveGroup.filter((q) => q.difficulty === 2).length,
                    hard: questionsForActiveGroup.filter((q) => q.difficulty === 3).length,
                  }}
                  actions={{
                    startEdit: actions.startEdit,
                    startAdd: actions.startAdd,
                    cancelEdit: actions.cancelEdit,
                    handleSaveEdit: actions.handleSaveEdit,
                    handleAdd: () => actions.handleAdd(Number(activeGroupId)),
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
                    onReorderQuestions: handleReorderQuestions,
                    onRegenerateForQuestion: isConsentRevoked ? undefined : actions.selectAndOpenRegenerateModal,
                    onSettingsForQuestion: isConsentRevoked ? undefined : actions.selectAndOpenTypeModal,
                  }}
                  stateFlags={{
                    savingEdit: state.savingEdit,
                    savingAdd: state.savingAdd,
                    editorError: state.editorError,
                    missingCorrectLive: derived.missingCorrectLive,
                    ensureChoices: derived.ensureChoices,
                  }}
                />
                )}

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
        title={state.singleQuestionRegenerateId !== null ? "✨ Regeneruj to pytanie z AI" : "✨ Regeneruj pytania z AI"}
        onClose={actions.closeRegenerateModal}
        onConfirm={isConsentRevoked ? undefined : actions.handleBulkRegenerate}
        variant="info"
        confirmLabel="Regeneruj"
        cancelLabel="Anuluj"
      >
        <Stack $gap="md">
          <Text>
            {state.singleQuestionRegenerateId !== null
              ? "Czy na pewno chcesz wygenerować nową wersję tego pytania? Obecna treść zostanie zastąpiona nowym wariantem."
              : "Czy na pewno chcesz wygenerować nowe wersje dla zaznaczonych pytań? Obecna treść zostanie zastąpiona nowymi wariantami."}
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
        title={state.singleQuestionTypeChangeId !== null ? "🔄 Zmień typ pytania" : "🔄 Zmień typ pytań"}
        onClose={actions.closeTypeModal}
        onConfirm={() => state.tempType && actions.handleBulkTypeChange(state.tempType)}
        confirmLabel="Zastosuj"
        variant="brand"
      >
        <Stack $gap="sm">
          <Text $variant="body3" $tone="muted" style={{ marginBottom: 8 }}>
            {state.singleQuestionTypeChangeId !== null
              ? "Na jaki typ chcesz zmienić to pytanie?"
              : "Na jaki typ chcesz zmienić zaznaczone pytania?"}
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

      <Modal
        isOpen={renameGroupId !== null}
        title="Zmień nazwę grupy"
        onClose={closeRenameGroupModal}
        footer={
          <Flex $justify="flex-end" $gap="sm">
            <Button $variant="outline" onClick={closeRenameGroupModal}>
              Anuluj
            </Button>
            <Button
              $variant="primary"
              onClick={handleRenameGroupSave}
              disabled={!renameGroupLabel.trim()}
            >
              Zapisz
            </Button>
          </Flex>
        }
      >
        <Stack $gap="sm">
          <Text $variant="body3" $tone="muted">
            Wpisz nową nazwę grupy:
          </Text>
          <Input
            $fullWidth
            value={renameGroupLabel}
            onChange={(e) => setRenameGroupLabel(e.target.value)}
            placeholder="np. Grupa A"
            aria-label="Nazwa grupy"
          />
        </Stack>
      </Modal>

      <Modal
        isOpen={groupIdToDelete !== null}
        title="Usuń grupę"
        onClose={closeRemoveGroupModal}
        onConfirm={handleConfirmRemoveGroup}
        variant="danger"
        confirmLabel="Usuń"
        cancelLabel="Anuluj"
      >
        Czy na pewno chcesz usunąć tę grupę? Wszystkie pytania w tej grupie zostaną trwale usunięte. Tej operacji nie można cofnąć.
      </Modal>

      <BulkActionBar
        selectedCount={state.selectedIds.length}
        onDelete={actions.openBulkDeleteModal}
        onOpenDifficulty={actions.openDifficultyModal}
        onOpenTypeChange={isConsentRevoked ? () => {} : actions.openTypeModal}
        onRegenerate={isConsentRevoked ? () => {} : actions.openRegenerateModal}
        regenerateDisabled={isConsentRevoked}
        typeChangeDisabled={isConsentRevoked}
        onClear={actions.clearSelection}
        isMenuOpen={state.isMobileMenuOpen}
        onOpenMenu={actions.openMobileMenu}
        onCloseMenu={actions.closeMobileMenu}
      />
    </Flex>
  );
};

export default TestDetailPage;
