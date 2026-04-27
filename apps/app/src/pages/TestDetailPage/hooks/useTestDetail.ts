import { useState, useMemo, useEffect, useRef } from "react";
import { useOutletContext, useParams, useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useLoader } from "../../../components/Loader/GlobalLoader";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import useTestData from "./useTestData";
import useQuestionDraft from "./useQuestionDraft";
import useTitleEdit from "./useTitleEdit";
import usePdfConfig from "./usePdfConfig";
import useJobPolling from "../../../hooks/useJobPolling";
import type { PdfExportConfig, TestDetail } from "../../../services/test";
import {
  bulkDeleteQuestions,
  bulkUpdateQuestions,
  bulkRegenerateQuestions,
  bulkConvertQuestions,
  reorderQuestions,
  createGroup,
  updateGroup,
  deleteGroup,
  duplicateGroup,
  createShuffledVariantGroup,
  generateGroupAIVariant,
  type GroupOut,
} from "../../../services/test";

type LayoutCtx = { refreshSidebarTests: () => Promise<void>; isGenerating?: boolean };

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
    /** Non-null when regenerate modal was opened for a single question (no bulk). */
    singleQuestionRegenerateId: number | null;
    isDifficultyModalOpen: boolean;
    isTypeModalOpen: boolean;
    /** Non-null when type modal was opened for a single question (no bulk). */
    singleQuestionTypeChangeId: number | null;
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
    regeneratingQuestionIds: number[];
    convertingQuestionIds: number[];
    isGenerating: boolean;
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
    handleAdd: (groupId: number) => Promise<void>;
    handleDelete: (qid: number) => Promise<void>;
    openQuestionDeleteModal: (qid: number) => void;
    closeQuestionDeleteModal: () => void;
    confirmQuestionDelete: () => Promise<void>;
    toggleSelect: (qid: number) => void;
    selectAll: () => void;
    clearSelection: () => void;
    onReorderQuestions?: (questionIds: number[]) => Promise<void>;
    handleBulkDelete: () => Promise<void>;
    handleBulkUpdate: (fields: { difficulty?: number; is_closed?: boolean }) => Promise<void>;
    handleBulkRegenerate: () => Promise<void>;
    openRegenerateModal: () => void;
    closeRegenerateModal: () => void;
    setRegenerationInstruction: (s: string) => void;
    /** Select single question and open regenerate modal. */
    selectAndOpenRegenerateModal: (qId: number) => void;
    openDifficultyModal: () => void;
    closeDifficultyModal: () => void;
    openTypeModal: () => void;
    closeTypeModal: () => void;
    /** Select single question and open type (open/closed) modal. */
    selectAndOpenTypeModal: (qId: number) => void;
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
    createGroup: (testId: number, label: string) => Promise<GroupOut | null>;
    updateGroup: (testId: number, groupId: number, label: string) => Promise<void>;
    deleteGroup: (testId: number, groupId: number) => Promise<void>;
    duplicateGroup: (testId: number, groupId: number) => Promise<GroupOut | null>;
    createShuffledVariantGroup: (testId: number, groupId: number) => Promise<GroupOut | null>;
    handleGenerateAIVariant: (groupId: number, onSuccess?: (newGroupId: number) => void) => Promise<void>;
  };
};

const useTestDetail = (): UseTestDetailResult => {
  const navigate = useNavigate();
  // const { refreshSidebarTests } = useOutletContext<LayoutCtx>();
  const context = useOutletContext<LayoutCtx | null>();
  const refreshSidebarTests = context?.refreshSidebarTests || (async () => {});
  const isGenerating = context?.isGenerating ?? false;
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
  const pendingVariantOnSuccessRef = useRef<((newGroupId: number) => void) | null>(null);
  const [regeneratingQuestionIds, setRegeneratingQuestionIds] = useState<number[]>([]);
  const [convertingQuestionIds, setConvertingQuestionIds] = useState<number[]>([]);

  const pollingOptions = useMemo(() => ({
    onDone: async (job: any) => {
      await refresh();
      stopLoading();
      clearSelection();
      setRegeneratingQuestionIds([]);
      setConvertingQuestionIds([]);
      if (job?.result?.group_id != null && pendingVariantOnSuccessRef.current) {
        pendingVariantOnSuccessRef.current(job.result.group_id);
        pendingVariantOnSuccessRef.current = null;
      }
    },
    onFail: (job: any) => {
      stopLoading();
      setRegeneratingQuestionIds([]);
      setConvertingQuestionIds([]);
      pendingVariantOnSuccessRef.current = null;
      alert(job.error || "Zadanie nie powiodło się");
    },
  }), [refresh, stopLoading]);

  const jobPolling = useJobPolling(pollingOptions);

  const [testIdToDelete, setTestIdToDelete] = useState<number | null>(null);
  const [questionIdToDelete, setQuestionIdToDelete] = useState<number | null>(null);
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);
  const [regenerationInstruction, setRegenerationInstruction] = useState("");
  /** When set, regenerate modal applies to this one question only (no bulk selection). */
  const [singleQuestionRegenerateId, setSingleQuestionRegenerateId] = useState<number | null>(null);
  const [isDifficultyModalOpen, setIsDifficultyModalOpen] = useState(false);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  /** When set, type modal applies to this one question only (no bulk selection). */
  const [singleQuestionTypeChangeId, setSingleQuestionTypeChangeId] = useState<number | null>(null);
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

  const handleSaveEdit = async () => {
    const next = await draftActions.handleSaveEdit(data);
    if (next) setData(next);
  };

  const handleAdd = async (groupId: number) => {
    await draftActions.handleAdd(data, refresh, groupId);
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
    const ids =
      singleQuestionRegenerateId !== null
        ? [singleQuestionRegenerateId]
        : selectedIds;
    if (ids.length === 0 || !data) return;

    const instruction = regenerationInstruction.trim();
    setIsRegenerateModalOpen(false);
    setRegenerationInstruction("");
    setSingleQuestionRegenerateId(null);
    setRegeneratingQuestionIds(ids);

    try {
      const res = await bulkRegenerateQuestions(data.test_id, {
        question_ids: ids,
        instruction: instruction || undefined,
      });
      jobPolling.startPolling(res.job_id);
    } catch (e: any) {
      setRegeneratingQuestionIds([]);
      alert(e.message || "Błąd podczas inicjowania regeneracji pytań");
    }
  };

  const openRegenerateModal = () => {
    setSingleQuestionRegenerateId(null);
    setIsRegenerateModalOpen(true);
  };
  const closeRegenerateModal = () => {
    setIsRegenerateModalOpen(false);
    setSingleQuestionRegenerateId(null);
  };
  const selectAndOpenRegenerateModal = (qId: number) => {
    setSingleQuestionRegenerateId(qId);
    setIsRegenerateModalOpen(true);
  };

  const openDifficultyModal = () => setIsDifficultyModalOpen(true);
  const closeDifficultyModal = () => {
    setIsDifficultyModalOpen(false);
    setTempDifficulty(null);
  };

  const openTypeModal = () => {
    setSingleQuestionTypeChangeId(null);
    setIsTypeModalOpen(true);
  };
  const closeTypeModal = () => {
    setIsTypeModalOpen(false);
    setTempType(null);
    setSingleQuestionTypeChangeId(null);
  };
  const selectAndOpenTypeModal = (qId: number) => {
    setSingleQuestionTypeChangeId(qId);
    setIsTypeModalOpen(true);
  };

  const handleBulkTypeChange = async (targetType: "open" | "closed") => {
    const ids =
      singleQuestionTypeChangeId !== null
        ? [singleQuestionTypeChangeId]
        : selectedIds;
    if (ids.length === 0 || !data) return;

    closeTypeModal();
    setSingleQuestionTypeChangeId(null);
    setConvertingQuestionIds(ids);

    try {
      const res = await bulkConvertQuestions(data.test_id, {
        question_ids: ids,
        target_type: targetType,
      });
      jobPolling.startPolling(res.job_id);
    } catch (e: any) {
      setConvertingQuestionIds([]);
      alert(e.message || "Błąd podczas konwersji pytań");
    }
  };

  const beginTitleEdit = (title: string) => titleActions.begin(title);
  const saveTitle = async () => {
    await titleActions.save(data, refreshSidebarTests, setData);
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

    const doDownload = async () => {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    };

    toast.promise(doDownload(), {
      loading: "Przygotowuję XML…",
      success: "XML gotowy — pobieranie rozpoczęte.",
      error: (e) => e?.message || "Nie udało się pobrać pliku XML.",
    });
  };

  const handleEditConfig = () => {
    if (!data) return;
    navigate(`/tests/new/ai?from=${data.test_id}`);
  };

  const onReorderQuestions = async (questionIds: number[]) => {
    if (!testIdNum) return;
    try {
      await reorderQuestions(testIdNum, questionIds);
      await refresh();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Nie udało się zmienić kolejności pytań");
    }
  };

  const createGroupAction = async (
    testId: number,
    label: string
  ): Promise<GroupOut | null> => {
    try {
      const newGroup = await createGroup(testId, { label });
      await refresh();
      return newGroup;
    } catch (e: any) {
      alert(e.message || "Nie udało się dodać grupy");
      return null;
    }
  };

  const updateGroupAction = async (
    testId: number,
    groupId: number,
    label: string
  ): Promise<void> => {
    try {
      await updateGroup(testId, groupId, { label });
      await refresh();
    } catch (e: any) {
      alert(e.message || "Nie udało się zmienić nazwy grupy");
    }
  };

  const deleteGroupAction = async (
    testId: number,
    groupId: number
  ): Promise<void> => {
    try {
      await deleteGroup(testId, groupId);
      await refresh();
    } catch (e: any) {
      alert(e.message || "Nie udało się usunąć grupy");
    }
  };

  const duplicateGroupAction = async (
    testId: number,
    groupId: number
  ): Promise<GroupOut | null> => {
    try {
      const result = await duplicateGroup(testId, groupId);
      await refresh();
      return result.group;
    } catch (e: any) {
      alert(e.message || "Nie udało się skopiować grupy");
      return null;
    }
  };

  const createShuffledVariantGroupAction = async (
    testId: number,
    groupId: number
  ): Promise<GroupOut | null> => {
    try {
      const newGroup = await createShuffledVariantGroup(testId, groupId);
      await refresh();
      return newGroup;
    } catch (e: any) {
      alert(e.message || "Nie udało się utworzyć wariantu z inną kolejnością");
      return null;
    }
  };

  const handleGenerateAIVariant = async (
    groupId: number,
    onSuccess?: (newGroupId: number) => void
  ) => {
    if (!data) return;
    if (onSuccess) pendingVariantOnSuccessRef.current = onSuccess;
    try {
      const res = await generateGroupAIVariant(data.test_id, groupId);
      jobPolling.startPolling(res.job_id);
    } catch (e: any) {
      pendingVariantOnSuccessRef.current = null;
      alert(e.message || "Nie udało się uruchomić generowania wariantu AI");
    }
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
      singleQuestionRegenerateId,
      isDifficultyModalOpen,
      isTypeModalOpen,
      singleQuestionTypeChangeId,
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
      regeneratingQuestionIds,
      convertingQuestionIds,
      isGenerating,
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
      onReorderQuestions,
      handleBulkDelete,
      handleBulkUpdate,
      handleBulkRegenerate,
      openRegenerateModal,
      closeRegenerateModal,
      setRegenerationInstruction,
      selectAndOpenRegenerateModal,
      openDifficultyModal,
      closeDifficultyModal,
      openTypeModal,
      closeTypeModal,
      selectAndOpenTypeModal,
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
      createGroup: createGroupAction,
      updateGroup: updateGroupAction,
      deleteGroup: deleteGroupAction,
      duplicateGroup: duplicateGroupAction,
      createShuffledVariantGroup: createShuffledVariantGroupAction,
      handleGenerateAIVariant,
    },
  };
};

export default useTestDetail;
