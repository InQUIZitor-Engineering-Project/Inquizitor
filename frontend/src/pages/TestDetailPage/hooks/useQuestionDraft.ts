import { useState } from "react";
import {
  addQuestion,
  updateQuestion,
  deleteQuestion,
  type QuestionOut,
  type TestDetail,
} from "../../../services/test";

const ensureChoices = (choices?: string[] | null): string[] =>
  choices && choices.length > 0 ? choices : ["", "", "", ""];

export interface UseQuestionDraftResult {
  state: {
    draft: Partial<QuestionOut>;
    editingId: number | null;
    isAdding: boolean;
    editorError: string | null;
    savingEdit: boolean;
    savingAdd: boolean;
  };
  derived: {
    hasAnyChoice: boolean;
    hasAnyCorrect: boolean;
    missingCorrectLive: boolean;
    ensureChoices: (choices?: string[] | null) => string[];
  };
  actions: {
    startEdit: (q: QuestionOut) => void;
    startAdd: () => void;
    cancelEdit: () => void;
    toggleDraftClosed: (closed: boolean) => void;
    setDraftDifficulty: (value: number) => void;
    onTextChange: (v: string) => void;
    updateDraftChoice: (index: number, value: string) => void;
    toggleDraftCorrect: (value: string, checked: boolean) => void;
    addDraftChoiceRow: () => void;
    removeChoiceRow: (index: number) => void;
    handleSaveEdit: (test: TestDetail | null) => Promise<TestDetail | null>;
    handleAdd: (test: TestDetail | null, refresh: () => Promise<void>) => Promise<void>;
    handleDelete: (test: TestDetail | null, qid: number, refresh: () => Promise<void>) => Promise<void>;
  };
}

const useQuestionDraft = () => {
  const [draft, setDraft] = useState<Partial<QuestionOut>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [savingAdd, setSavingAdd] = useState(false);

  const startEdit = (q: QuestionOut) => {
    setIsAdding(false);
    setEditorError(null);
    setEditingId(q.id);
    setDraft({
      id: q.id,
      text: q.text,
      is_closed: q.is_closed,
      difficulty: q.difficulty,
      choices: q.is_closed ? ensureChoices(q.choices) : q.choices,
      correct_choices: q.is_closed ? q.correct_choices || [] : q.correct_choices,
    });
  };

  const startAdd = () => {
    setEditorError(null);
    setEditingId(null);
    setIsAdding(true);
    setDraft({
      text: "",
      is_closed: true,
      difficulty: 1,
      choices: ["", "", "", ""],
      correct_choices: [],
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditorError(null);
    setIsAdding(false);
    setDraft({});
  };

  const setDraftDifficulty = (value: number) => setDraft((d) => ({ ...d, difficulty: value }));
  const onTextChange = (v: string) => {
    setDraft((d) => ({ ...d, text: v }));
    setEditorError(null);
  };

  const toggleDraftClosed = (closed: boolean) => {
    setDraft((d) => {
      if (closed) {
        return {
          ...d,
          is_closed: true,
          choices: ensureChoices(d.choices),
          correct_choices: d.correct_choices || [],
        };
      }
      return { ...d, is_closed: false };
    });
    setEditorError(null);
  };

  const updateDraftChoice = (index: number, value: string) => {
    setDraft((d) => {
      const choices = ensureChoices(d.choices);
      choices[index] = value;
      return { ...d, choices };
    });
    setEditorError(null);
  };

  const toggleDraftCorrect = (value: string, checked: boolean) => {
    setDraft((d) => {
      const current = d.correct_choices || [];
      let next = [...current];
      if (checked) {
        if (value && !next.includes(value)) next.push(value);
      } else {
        next = next.filter((c) => c !== value);
      }
      return { ...d, correct_choices: next };
    });
    setEditorError(null);
  };

  const addDraftChoiceRow = () => {
    setDraft((d) => ({
      ...d,
      choices: [...ensureChoices(d.choices), ""],
    }));
  };

  const removeChoiceRow = (index: number) => {
    setDraft((d) => {
      const current = ensureChoices(d.choices);
      const removedVal = current[index] ?? "";
      const nextChoices = [...current.slice(0, index), ...current.slice(index + 1)];
      if (nextChoices.length === 0) nextChoices.push("");
      const nextCorrect = (d.correct_choices || []).filter((c) => c !== removedVal);
      return { ...d, choices: nextChoices, correct_choices: nextCorrect };
    });
    setEditorError(null);
  };

  const validatePayload = (payload: any) => {
    if (!payload.text) {
      setEditorError("Podaj treść pytania.");
      return false;
    }
    if (payload.is_closed) {
      const cleanedChoices = (payload.choices || [])
        .map((c: string) => (c || "").trim())
        .filter((c: string) => c);
      const cleanedCorrect = (payload.correct_choices || []).filter((c: string) =>
        cleanedChoices.includes(c)
      );

      if (cleanedChoices.length === 0) {
        setEditorError("Dodaj przynajmniej jedną odpowiedź.");
        return false;
      }
      if (cleanedCorrect.length === 0) {
        setEditorError("Zaznacz przynajmniej jedną poprawną odpowiedź.");
        return false;
      }
      payload.choices = cleanedChoices;
      payload.correct_choices = cleanedCorrect;
    } else {
      payload.choices = null;
      payload.correct_choices = null;
    }
    return true;
  };

  const handleSaveEdit = async (test: TestDetail | null) => {
    if (!test || editingId == null) return test;
    setEditorError(null);
    setSavingEdit(true);

    try {
      const payload: any = {
        text: draft.text,
        is_closed: !!draft.is_closed,
        difficulty: draft.difficulty || 1,
        choices: draft.choices,
        correct_choices: draft.correct_choices,
      };
      if (!validatePayload(payload)) return test;

      await updateQuestion(test.test_id, editingId, payload);
      const nextQuestions = test.questions.map((q) => (q.id === editingId ? { ...q, ...payload } : q));
      cancelEdit();
      return { ...test, questions: nextQuestions };
    } catch (e: any) {
      alert(e.message || "Nie udało się zapisać zmian");
      return test;
    } finally {
      setSavingEdit(false);
    }
  };

  const handleAdd = async (test: TestDetail | null, refresh: () => Promise<void>) => {
    if (!test) return;
    setEditorError(null);
    setSavingAdd(true);

    try {
      const payload: any = {
        text: (draft.text || "").trim(),
        is_closed: !!draft.is_closed,
        difficulty: draft.difficulty || 1,
        choices: draft.choices,
        correct_choices: draft.correct_choices,
      };
      if (!validatePayload(payload)) return;

      await addQuestion(test.test_id, payload);
      await refresh();
      cancelEdit();
    } catch (e: any) {
      setEditorError(e.message || "Nie udało się dodać pytania.");
    } finally {
      setSavingAdd(false);
    }
  };

  const handleDelete = async (test: TestDetail | null, qid: number, refresh: () => Promise<void>) => {
    if (!test) return;
    if (!confirm("Na pewno usunąć to pytanie?")) return;
    try {
      await deleteQuestion(test.test_id, qid);
      await refresh();
    } catch (e: any) {
      alert(e.message || "Nie udało się usunąć pytania");
    }
  };

  const hasAnyChoice = (draft.choices || []).some((c) => (c || "").trim().length > 0);
  const hasAnyCorrect = (draft.correct_choices || []).length > 0;
  const missingCorrectLive = !!draft.is_closed && hasAnyChoice && !hasAnyCorrect;

  return {
    state: {
      draft,
      editingId,
      isAdding,
      editorError,
      savingEdit,
      savingAdd,
    },
    derived: {
      hasAnyChoice,
      hasAnyCorrect,
      missingCorrectLive,
      ensureChoices,
    },
    actions: {
      startEdit,
      startAdd,
      cancelEdit,
      toggleDraftClosed,
      setDraftDifficulty,
      onTextChange,
      updateDraftChoice,
      toggleDraftCorrect,
      addDraftChoiceRow,
      removeChoiceRow,
      handleSaveEdit,
      handleAdd,
      handleDelete,
    },
  };
};

export default useQuestionDraft;
