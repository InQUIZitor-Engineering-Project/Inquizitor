import { useState, useMemo, useEffect } from "react";
import { useOutletContext, useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useLoader } from "../../../components/Loader/GlobalLoader";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import useTestData, { sortQuestions } from "./useTestData";
import useQuestionDraft from "./useQuestionDraft";
import useTitleEdit from "./useTitleEdit";
import usePdfConfig from "./usePdfConfig";
import useJobPolling from "../../../hooks/useJobPolling";
import type { PdfExportConfig, TestDetail } from "../../../services/test";
import { bulkDeleteQuestions, bulkUpdateQuestions, bulkRegenerateQuestions, bulkConvertQuestions } from "../../../services/test";

type LayoutCtx = { refreshSidebarTests: () => Promise<void> };

type UseTestDetailResult = {
  state: {
    data: TestDetail | null;
    draft: ReturnType<typeof useQuestionDraft>["state"]["draft"];
    editingId: number | null;
    isAdding: boolean;
    isEditingTitle: boolean;
    titleDraft: string;
    pdfConfig: PdfExportConfig;
    pdfConfigOpen: boolean;
    pdfConfigValid: boolean;
    testIdToDelete: number | null;
    questionIdToDelete: number | null;
    isRegenerateModalOpen: boolean;
    regenerationInstruction: string;
    isDifficultyModalOpen: boolean;
    isTypeModalOpen: boolean;
    isBulkDeleteModalOpen: boolean;
    isMobileMenuOpen: boolean;
    tempDifficulty: number | null;
    tempType: "open" | "closed" | null;
    editorError: string | null;
    savingEdit: boolean;
    savingAdd: boolean;
    loading: boolean;
    error: string | null;
    selectedIds: number[];
  };
  derived: {
    closedCount: number;
    openCount: number;
    missingCorrectLive: boolean;
    hasAnyChoice: boolean;
    hasAnyCorrect: boolean;
    ensureChoices: (choices?: string[] | null) => string[];
  };
  actions: {
    startEdit: ReturnType<typeof useQuestionDraft>["actions"]["startEdit"];
    startAdd: ReturnType<typeof useQuestionDraft>["actions"]["startAdd"];
    cancelEdit: ReturnType<typeof useQuestionDraft>["actions"]["cancelEdit"];
    toggleDraftClosed: ReturnType<typeof useQuestionDraft>["actions"]["toggleDraftClosed"];
    setDraftDifficulty: ReturnType<typeof useQuestionDraft>["actions"]["setDraftDifficulty"];
    onTextChange: ReturnType<typeof useQuestionDraft>["actions"]["onTextChange"];
    updateDraftChoice: ReturnType<typeof useQuestionDraft>["actions"]["updateDraftChoice"];
    toggleDraftCorrect: ReturnType<typeof useQuestionDraft>["actions"]["toggleDraftCorrect"];
    addDraftChoiceRow: ReturnType<typeof useQuestionDraft>["actions"]["addDraftChoiceRow"];
    removeChoiceRow: ReturnType<typeof useQuestionDraft>["actions"]["removeChoiceRow"];
    handleSaveEdit: () => Promise<void>;
    handleAdd: () => Promise<void>;
    handleDelete: (qid: number) => Promise<void>;
    openQuestionDeleteModal: (qid: number) => void;
    closeQuestionDeleteModal: () => void;
    confirmQuestionDelete: () => Promise<void>;
    toggleSelect: (qid: number) => void;
    selectAll: () => void;
    clearSelection: () => void;
    handleBulkDelete: () => Promise<void>;
    handleBulkUpdate: (fields: { difficulty?: number; is_closed?: boolean }) => Promise<void>;
    handleBulkRegenerate: () => Promise<void>;
    openRegenerateModal: () => void;
    closeRegenerateModal: () => void;
    setRegenerationInstruction: (s: string) => void;
    openDifficultyModal: () => void;
    closeDifficultyModal: () => void;
    openTypeModal: () => void;
    closeTypeModal: () => void;
    openBulkDeleteModal: () => void;
    closeBulkDeleteModal: () => void;
    openMobileMenu: () => void;
    closeMobileMenu: () => void;
    handleBulkTypeChange: (targetType: "open" | "closed") => Promise<void>;
    setTempDifficulty: (d: number) => void;
    setTempType: (t: "open" | "closed") => void;
    beginTitleEdit: (title: string) => void;
    saveTitle: () => Promise<void>;
    cancelTitle: () => void;
    setTitleDraft: (value: string) => void;
    handleOpenDeleteModal: (testId: number) => void;
    handleCloseModal: () => void;
    handleConfirmDelete: () => Promise<void>;
    setPdfConfigOpen: (next: boolean) => void;
    setPdfConfig: (updater: (cfg: PdfExportConfig) => PdfExportConfig) => void;
    resetPdfConfig: () => void;
    setPdfConfigValid: (valid: boolean) => void;
    handleDownloadCustomPdf: () => Promise<void>;
    downloadXml: () => Promise<void>;
    handleEditConfig: () => void;
  };
};

const useTestDetail = (): UseTestDetailResult => {
  const navigate = useNavigate();
  const { refreshSidebarTests } = useOutletContext<LayoutCtx>();
  const { withLoader, startLoading, stopLoading } = useLoader();
  const { data, loading, error, refresh, deleteCurrent, setData } = useTestData();
  const {
    state: draftState,
    derived: draftDerived,
    actions: draftActions,
  } = useQuestionDraft();
  const { state: titleState, actions: titleActions } = useTitleEdit();
  const { state: pdfState, actions: pdfActions } = usePdfConfig();

  const [pdfConfigValid, setPdfConfigValid] = useState(true);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const clearSelection = () => setSelectedIds([]);

  const pollingOptions = useMemo(() => ({
    onDone: async () => {
      await refresh();
      stopLoading();
      clearSelection();
    },
    onFail: (job: any) => {
      stopLoading();
      alert(job.error || "Regeneracja pytań nie powiodła się");
    },
  }), [refresh, stopLoading]);

  const jobPolling = useJobPolling(pollingOptions);

  const [testIdToDelete, setTestIdToDelete] = useState<number | null>(null);
  const [questionIdToDelete, setQuestionIdToDelete] = useState<number | null>(null);
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);
  const [regenerationInstruction, setRegenerationInstruction] = useState("");
  const [isDifficultyModalOpen, setIsDifficultyModalOpen] = useState(false);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [tempDifficulty, setTempDifficulty] = useState<number | null>(null);
  const [tempType, setTempType] = useState<"open" | "closed" | null>(null);

  const { testId } = useParams<{ testId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const testIdNum = Number(testId);
  const pageTitle = data?.title ? `${data.title} | Inquizitor` : "Test | Inquizitor";
  useDocumentTitle(pageTitle);

  useEffect(() => {
    if (searchParams.get("isAdding") === "true" && data && !draftState.isAdding) {
      draftActions.startAdd();
      searchParams.delete("isAdding");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, data, draftState.isAdding, draftActions, setSearchParams]);

  const setDataSorted = (next: TestDetail | null) => {
    setData(next ? { ...next, questions: sortQuestions(next.questions) } : next);
  };

  const handleSaveEdit = async () => {
    const next = await draftActions.handleSaveEdit(data);
    if (next) setDataSorted(next);
  };

  const handleAdd = async () => {
    await draftActions.handleAdd(data, refresh);
  };


  const handleOpenDeleteModal = (id: number) => setTestIdToDelete(id);
  const handleCloseModal = () => setTestIdToDelete(null);

  const handleConfirmDelete = async () => {
    if (testIdToDelete === null) return;
    try {
      await deleteCurrent(testIdToDelete);
    } finally {
      handleCloseModal();
    }
  };

  const handleOpenQuestionDeleteModal = (qid: number) => {
    setQuestionIdToDelete(qid);
  };

  const handleCloseQuestionDeleteModal = () => {
    setQuestionIdToDelete(null);
  };

  const handleConfirmQuestionDelete = async () => {
    if (questionIdToDelete === null || !data) return;
    try {      
      await draftActions.handleDeleteConfirmed(data, questionIdToDelete, refresh);
    } catch (e: any) {
      alert(e.message || "Nie udało się usunąć pytania");
    } finally {
      handleCloseQuestionDeleteModal();
    }
  };

  const toggleSelect = (qid: number) => {
    setSelectedIds((prev) =>
      prev.includes(qid) ? prev.filter((id) => id !== qid) : [...prev, qid]
    );
  };

  const selectAll = () => {
    if (!data) return;
    setSelectedIds(data.questions.map((q) => q.id));
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0 || !data) return;

    setIsBulkDeleteModalOpen(false);
    await withLoader(async () => {
      try {
        await bulkDeleteQuestions(data.test_id, { question_ids: selectedIds });
        await refresh();
        clearSelection();
      } catch (e: any) {
        alert(e.message || "Błąd podczas masowego usuwania");
      }
    });
  };

  const openBulkDeleteModal = () => setIsBulkDeleteModalOpen(true);
  const closeBulkDeleteModal = () => setIsBulkDeleteModalOpen(false);

  const openMobileMenu = () => setIsMobileMenuOpen(true);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleBulkUpdate = async (fields: { difficulty?: number; is_closed?: boolean }) => {
    if (selectedIds.length === 0 || !data) return;

    await withLoader(async () => {
      try {
        await bulkUpdateQuestions(data.test_id, {
          question_ids: selectedIds,
          ...fields,
        });
        await refresh();
        clearSelection();
        closeDifficultyModal();
      } catch (e: any) {
        alert(e.message || "Błąd podczas masowej aktualizacji");
      }
    });
  };

  const handleBulkRegenerate = async () => {
    if (selectedIds.length === 0 || !data) return;

    const instruction = regenerationInstruction.trim();
    setIsRegenerateModalOpen(false);
    setRegenerationInstruction(""); // Czyścimy po zamknięciu
    startLoading();

    try {
      const res = await bulkRegenerateQuestions(data.test_id, {
        question_ids: selectedIds,
        instruction: instruction || undefined,
      });
      jobPolling.startPolling(res.job_id);
    } catch (e: any) {
      stopLoading();
      alert(e.message || "Błąd podczas inicjowania regeneracji pytań");
    }
  };

  const openRegenerateModal = () => setIsRegenerateModalOpen(true);
  const closeRegenerateModal = () => setIsRegenerateModalOpen(false);

  const openDifficultyModal = () => setIsDifficultyModalOpen(true);
  const closeDifficultyModal = () => {
    setIsDifficultyModalOpen(false);
    setTempDifficulty(null);
  };

  const openTypeModal = () => setIsTypeModalOpen(true);
  const closeTypeModal = () => {
    setIsTypeModalOpen(false);
    setTempType(null);
  };

  const handleBulkTypeChange = async (targetType: "open" | "closed") => {
    if (selectedIds.length === 0 || !data) return;

    closeTypeModal();
    startLoading();

    try {
      const res = await bulkConvertQuestions(data.test_id, {
        question_ids: selectedIds,
        target_type: targetType,
      });
      jobPolling.startPolling(res.job_id);
    } catch (e: any) {
      stopLoading();
      alert(e.message || "Błąd podczas konwersji pytań");
    }
  };

  const beginTitleEdit = (title: string) => titleActions.begin(title);
  const saveTitle = async () => {
    await titleActions.save(data, refreshSidebarTests, setDataSorted);
  };
  const cancelTitle = () => titleActions.cancel(data?.title);
  const setTitleDraft = (value: string) => titleActions.change(value);

  const handleDownloadCustomPdf = async () => {
    if (!data?.test_id) return;
    if (!pdfConfigValid) {
      alert("Ustaw poprawną wysokość pola odpowiedzi (1–10 cm), aby pobrać PDF.");
      return;
    }
    await pdfActions.downloadCustomPdf(data.test_id);
  };

  const downloadXml = async () => {
    if (!testIdNum) return;
    const url = `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/tests/${testIdNum}/export/xml`;
    const filename = `test_${testIdNum}.xml`;
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!token) return;
    await withLoader(async () => {
      try {
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const blob = await res.blob();
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
      } catch (e: any) {
        alert(`Nie udało się pobrać pliku: ${e.message || e}`);
      }
    });
  };

  const handleEditConfig = () => {
    if (!data) return;
    navigate(`/tests/new/ai?from=${data.test_id}`);
  };

  const closedCount = data?.questions.filter((q) => q.is_closed).length || 0;
  const openCount = data ? data.questions.length - closedCount : 0;

  return {
    state: {
      data,
      draft: draftState.draft,
      editingId: draftState.editingId,
      isAdding: draftState.isAdding,
      isEditingTitle: titleState.isEditingTitle,
      titleDraft: titleState.titleDraft,
      pdfConfig: pdfState.pdfConfig,
      pdfConfigOpen: pdfState.pdfConfigOpen,
      pdfConfigValid,
      testIdToDelete,
      questionIdToDelete,
      isRegenerateModalOpen,
      regenerationInstruction,
      isDifficultyModalOpen,
      isTypeModalOpen,
      isBulkDeleteModalOpen,
      isMobileMenuOpen,
      tempDifficulty,
      tempType,
      editorError: draftState.editorError,
      savingEdit: draftState.savingEdit,
      savingAdd: draftState.savingAdd,
      loading,
      error,
      selectedIds,
    },
    derived: {
      closedCount,
      openCount,
      missingCorrectLive: draftDerived.missingCorrectLive,
      hasAnyChoice: draftDerived.hasAnyChoice,
      hasAnyCorrect: draftDerived.hasAnyCorrect,
      ensureChoices: draftDerived.ensureChoices,
    },
    actions: {
      startEdit: draftActions.startEdit,
      startAdd: draftActions.startAdd,
      cancelEdit: draftActions.cancelEdit,
      toggleDraftClosed: draftActions.toggleDraftClosed,
      setDraftDifficulty: draftActions.setDraftDifficulty,
      onTextChange: draftActions.onTextChange,
      updateDraftChoice: draftActions.updateDraftChoice,
      toggleDraftCorrect: draftActions.toggleDraftCorrect,
      addDraftChoiceRow: draftActions.addDraftChoiceRow,
      removeChoiceRow: draftActions.removeChoiceRow,
      handleSaveEdit,
      handleAdd,
      handleDelete: async (qid) => { handleOpenQuestionDeleteModal(qid); },
      openQuestionDeleteModal: handleOpenQuestionDeleteModal,
      closeQuestionDeleteModal: handleCloseQuestionDeleteModal,
      confirmQuestionDelete: handleConfirmQuestionDelete,
      toggleSelect,
      selectAll,
      clearSelection,
      handleBulkDelete,
      handleBulkUpdate,
      handleBulkRegenerate,
      openRegenerateModal,
      closeRegenerateModal,
      setRegenerationInstruction,
      openDifficultyModal,
      closeDifficultyModal,
      openTypeModal,
      closeTypeModal,
      openBulkDeleteModal,
      closeBulkDeleteModal,
      openMobileMenu,
      closeMobileMenu,
      handleBulkTypeChange,
      setTempDifficulty,
      setTempType,
      beginTitleEdit,
      saveTitle,
      cancelTitle,
      setTitleDraft,
      handleOpenDeleteModal,
      handleCloseModal,
      handleConfirmDelete,
      setPdfConfigOpen: pdfActions.setPdfConfigOpen,
      setPdfConfig: pdfActions.updatePdfConfig,
      resetPdfConfig: pdfActions.resetPdfConfig,
      setPdfConfigValid,
      handleDownloadCustomPdf,
      downloadXml,
      handleEditConfig,
    },
  };
};

export default useTestDetail;
