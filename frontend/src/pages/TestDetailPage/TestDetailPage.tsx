import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { useLoader } from "../../components/Loader/GlobalLoader";
import ConfirmationModal from "../../components/ConfirmationModal/ConfirmationModal";
import editIcon from "../../assets/icons/edit-icon.png";
import trashIcon from "../../assets/icons/Trash.png";
import { MathText } from "../../components/MathText/MathText";

import {
  getTestDetail,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  deleteTest,
  updateTestTitle,
  exportCustomPdf,
} from "../../services/test";
import type { TestDetail, QuestionOut, PdfExportConfig } from "../../services/test";
import { Checkbox } from "../../components/GeneralComponents/Checkbox/Checkbox";
import { CollapsibleSection } from "../../components/GeneralComponents/CollapsibleSection/CollapsibleSection";
import { SectionCard } from "../../components/GeneralComponents/SectionCard/SectionCard";
import Footer from "../../components/Footer/Footer";

import {
  PageWrapper,
  ContentWrapper,
  Header,
  Meta,
  QuestionList,
  QuestionItem,
  ChoiceList,
  ChoiceItem,
  QuestionHeaderRow,
  QuestionTitle,
  QuestionMeta,
  DifficultyBadge,
  TypeBadge,
  QuestionActions,
  PrimaryButton,
  GhostButton,
  DangerButton,
  EditButton,
  AddQuestionBar,
  AddQuestionButton,
  DownloadBar,
  DownloadButton,
  TitleRow,
  TitleEditIconBtn,
  HeaderInput,
  TitleActions,
  TitleSmallButton,
  TitleSmallCancel,
  EditorCard,
  EditorToolbar,
  Segmented,
  NiceSelect,
  EditorTextarea,
  ChoiceListEditor,
  ChoiceRow,
  LetterBubble,
  ChoiceInput,
  CorrectToggle,
  AddChoiceBtn,
  EditorActions,
  ErrorNote,
  EditorHint,
  Divider,  
  AiWarningBox,
  MetaRow,
  TrashBtn,
  PdfConfigSelect,
  PdfConfigNumberInput,
  ConfigActions,
  ConfigGrid,
  ConfigField,
  ConfigSection,
  InnerWrapper,
} from "./TestDetailPage.styles";
import useDocumentTitle from "../../components/GeneralComponents/Hooks/useDocumentTitle";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

function toArray<T = string>(v: any): T[] {
  if (Array.isArray(v)) return v as T[];
  if (v == null) return [];
  if (typeof v === "string") {
    try {
      const j = JSON.parse(v);
      if (Array.isArray(j)) return j as T[];
    } catch {
      /* ignore */
    }
    return v.trim() ? [v as unknown as T] : [];
  }
  return [v as T];
}

const getDifficultyLabel = (d: number) => {
  if (d === 1) return "Łatwe";
  if (d === 2) return "Średnie";
  if (d === 3) return "Trudne";
  return `Poziom ${d}`;
};

const ensureChoices = (choices?: string[] | null): string[] =>
  choices && choices.length > 0 ? choices : ["", "", "", ""];

type LayoutCtx = { refreshSidebarTests: () => Promise<void> };


// --- component ---

const TestDetailPage: React.FC = () => {
  
  const { testId } = useParams<{ testId: string }>();
  const testIdNum = Number(testId);
  const navigate = useNavigate();
  const { withLoader } = useLoader();

  const [data, setData] = useState<TestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Partial<QuestionOut>>({});
  const [isAdding, setIsAdding] = useState(false);

  const [testIdToDelete, setTestIdToDelete] = useState<number | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const { refreshSidebarTests } = useOutletContext<LayoutCtx>();
  const [editorError, setEditorError] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [savingAdd, setSavingAdd]   = useState(false);

  const [pdfConfig, setPdfConfig] = useState<PdfExportConfig>({
    answer_space_style: "blank",
    space_height_cm: 3,
    include_answer_key: false,
    generate_variants: false,
    swap_order_variants: null,
    student_header: true,
    use_scratchpad: false,
    mark_multi_choice: true,
  });
  const [pdfConfigOpen, setPdfConfigOpen] = useState(false);

  const token = localStorage.getItem("access_token");

  const download = (url: string, filename: string) => {
    withLoader(async () => {
      try {
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error(`${res.status} ${res.statusText}`);
        }

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

  const handleDownloadCustomPdf = async () => {
    if (!testIdNum) return;
    try {
      const blob = await exportCustomPdf(testIdNum, pdfConfig);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `test_${testIdNum}_custom.pdf`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e: any) {
      alert(e.message || "Nie udało się wyeksportować spersonalizowanego PDF.");
    }
  };


  useEffect(() => {
    if (!testId) return;
    const id = Number(testId);
    if (!Number.isFinite(id)) {
      setError("Nieprawidłowe ID testu");
      return;
    }
    getTestDetail(id)
          .then((detail) => {
            setData(detail);
            setTitleDraft(detail.title || "");
            setError(null);
            // Resetowanie stanów edycji przy zmianie testu
            setEditingId(null);
            setIsAdding(false);
            setDraft({});
          })
          .catch((e) => setError(e.message))
          .finally(() => setLoading(false));
    }, [testId]);

  const refreshTest = async () => {
    if (!testIdNum) return;
    const detail = await getTestDetail(testIdNum);
    setData(detail);
  };

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

  const handleSaveEdit = async () => {
    if (!data || editingId == null) return;
    setEditorError(null);
    setSavingEdit(true);

    try {
      const payload: any = {
        text: draft.text,
        is_closed: !!draft.is_closed,
        difficulty: draft.difficulty || 1,
      };
      if (!payload.text) {
        setEditorError("Podaj treść pytania.");
        return;
      }

      if (payload.is_closed) {
        const cleanedChoices = (draft.choices || [])
          .map((c) => (c || "").trim())
          .filter((c) => c);
        const cleanedCorrect = (draft.correct_choices || []).filter((c) =>
          cleanedChoices.includes(c)
        );

        if (cleanedChoices.length === 0) {
          setEditorError("Dodaj przynajmniej jedną odpowiedź.");
          return;
        }
        if (cleanedCorrect.length === 0) {
          setEditorError("Zaznacz przynajmniej jedną poprawną odpowiedź.");
          return;
        }
        payload.choices = cleanedChoices;
        payload.correct_choices = cleanedCorrect;
      } else {
        payload.choices = null;
        payload.correct_choices = null;
      }

      await updateQuestion(data.test_id, editingId, payload);

      // lokalna aktualizacja bez zmiany kolejności
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          questions: prev.questions.map((q) =>
            q.id === editingId ? { ...q, ...payload } : q
          ),
        };
      });

      cancelEdit();
    } catch (e: any) {
      alert(e.message || "Nie udało się zapisać zmian");
    } finally {
      setSavingEdit(false);
    }
  };

  const removeChoiceRow = (index: number) => {
    setDraft((d) => {
      const current = ensureChoices(d.choices);
      const removedVal = current[index] ?? "";

      const nextChoices = [...current.slice(0, index), ...current.slice(index + 1)];

      if (nextChoices.length === 0) nextChoices.push("");

      let nextCorrect = (d.correct_choices || []).filter((c) => c !== removedVal);

      return {
        ...d,
        choices: nextChoices,
        correct_choices: nextCorrect,
      };
    });
    setEditorError(null);
  };

  const handleAdd = async () => {
    if (!data) return;
    setEditorError(null);
    setSavingAdd(true);

    try {
      const payload: any = {
        text: (draft.text || "").trim(),
        is_closed: !!draft.is_closed,
        difficulty: draft.difficulty || 1,
      };

      if (!payload.text) {
        setEditorError("Podaj treść pytania.");
        return;
      }
      if (payload.is_closed) {
        const cleanedChoices = (draft.choices || [])
          .map((c) => (c || "").trim())
          .filter((c) => c);
        if (cleanedChoices.length === 0) {
          setEditorError("Dodaj przynajmniej jedną odpowiedź.");
          return;
        }
        const cleanedCorrect = (draft.correct_choices || []).filter((c) =>
          cleanedChoices.includes(c)
        );
        if (cleanedCorrect.length === 0) {
          setEditorError("Zaznacz przynajmniej jedną poprawną odpowiedź.");
          return;
        }
        payload.choices = cleanedChoices;
        payload.correct_choices = cleanedCorrect;
      } else {
        payload.choices = null;
        payload.correct_choices = null;
      }

      await addQuestion(data.test_id, payload);
      await refreshTest(); // ensure the new question appears at the end
      cancelEdit();
    } catch (e: any) {
      setEditorError(e.message || "Nie udało się dodać pytania.");
    } finally {
      setSavingAdd(false);
    }
  };

  const handleDelete = async (qid: number) => {
    if (!data) return;
    if (!confirm("Na pewno usunąć to pytanie?")) return;
    try {
      await deleteQuestion(data.test_id, qid);
      await refreshTest();
    } catch (e: any) {
      alert(e.message || "Nie udało się usunąć pytania");
    }
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
      return {
        ...d,
        is_closed: false,
      };
    });
  };

  const setDraftDifficulty = (value: number) => {
    setDraft((d) => ({ ...d, difficulty: value }));
  };
  const onTextChange = (v: string) => {
    setDraft(d => ({ ...d, text: v }));
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

  const handleOpenDeleteModal = (testId: number) => {
    setTestIdToDelete(testId);
  };

  const handleCloseModal = () => {
    setTestIdToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (testIdToDelete === null) return;

    try {
      await deleteTest(testIdToDelete);

      await refreshSidebarTests();

      navigate('/dashboard');

    } catch (err) {
      alert("Nie udało się usunąć testu: " + (err as Error).message);
    } finally {
      handleCloseModal();
    }
  };
  const beginTitleEdit = () => {
    if (!data) return;
    setTitleDraft(data.title || "");
    setIsEditingTitle(true);
  };

  const saveTitle = async () => {
    if (!data) return;
    const next = titleDraft.trim();
    if (!next) {
      alert("Tytuł nie może być pusty");
      return;
    }
    try {
      await withLoader(async () => {
        const updated = await updateTestTitle(data.test_id, next);
        setData((prev) => (prev ? { ...prev, title: updated.title } : prev));
        setIsEditingTitle(false);
        await refreshSidebarTests();

      });
    } catch (e: any) {
      alert(e.message || "Nie udało się zaktualizować tytułu");
    }
  };

  const cancelTitle = () => {
    setTitleDraft(data?.title || "");
    setIsEditingTitle(false);
  };

  useDocumentTitle("Test | Inquizitor");

  if (loading) return <PageWrapper>Ładowanie…</PageWrapper>;
  if (error) return <PageWrapper>Błąd: {error}</PageWrapper>;
  if (!data) return null;

  const closedCount = data.questions.filter((q) => q.is_closed).length;
  const openCount = data.questions.length - closedCount;

  const hasAnyChoice = (draft.choices || []).some(c => (c || "").trim().length > 0);
  const hasAnyCorrect = (draft.correct_choices || []).length > 0;

  const canSaveBase = (draft.text || "").trim().length > 0;
  const canSaveNew  = draft.is_closed ? (canSaveBase && hasAnyChoice) : canSaveBase;
  const canSaveEdit = draft.is_closed ? (canSaveBase && hasAnyChoice) : canSaveBase;

  const missingCorrectLive = !!draft.is_closed && hasAnyChoice && !hasAnyCorrect;

  return (
    <PageWrapper>

      <ContentWrapper>
        <InnerWrapper>
        <TitleRow>
          {isEditingTitle ? (
            <>
              <HeaderInput
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                placeholder="Nazwa testu"
              />
              <TitleActions>
                <TitleSmallButton onClick={saveTitle}>Zapisz</TitleSmallButton>
                <TitleSmallCancel onClick={cancelTitle}>Anuluj</TitleSmallCancel>
              </TitleActions>
            </>
          ) : (
            <>
              <Header>{data.title}</Header>
              <TitleEditIconBtn onClick={beginTitleEdit} title="Edytuj tytuł">
                <img src={editIcon} alt="Edytuj" />
              </TitleEditIconBtn>
            </>
          )}
        </TitleRow>
        
        <MetaRow>
          <Meta>
            {data.questions.length} pytań |{" "}
            {data.questions.filter((q) => q.difficulty === 1).length} łatwe,{" "}
            {data.questions.filter((q) => q.difficulty === 2).length} średnie,{" "}
            {data.questions.filter((q) => q.difficulty === 3).length} trudne |{" "}
            {closedCount > 0 && openCount > 0
              ? `Mieszane (${closedCount} zamkniętych, ${openCount} otwartych)`
              : closedCount === data.questions.length
              ? "Zamknięte"
              : "Otwarte"}
          </Meta>

        </MetaRow>

        <QuestionList>
          {data.questions.map((q, idx) => {
            const isEditing = editingId === q.id;

            if (isEditing) {
              return (
              <QuestionItem key={q.id}>
                <EditorCard>
                  <EditorToolbar>
                    <Segmented>
                      <button
                        className={draft.is_closed ? "is-active-closed" : ""}
                        onClick={() => toggleDraftClosed(true)}
                        type="button"
                      >
                        Zamknięte
                      </button>
                      <button
                        className={!draft.is_closed ? "is-active-open" : ""}
                        onClick={() => toggleDraftClosed(false)}
                        type="button"
                      >
                        Otwarte
                      </button>
                    </Segmented>

                    <NiceSelect
                      value={draft.difficulty || 1}
                      onChange={(e) => setDraftDifficulty(Number(e.target.value))}
                      aria-label="Poziom trudności"
                    >
                      <option value={1}>Łatwe</option>
                      <option value={2}>Średnie</option>
                      <option value={3}>Trudne</option>
                    </NiceSelect>
                  </EditorToolbar>

                  <EditorTextarea
                    value={draft.text || ""}
                    onChange={(e) => onTextChange(e.target.value)}
                    placeholder="Wpisz treść pytania…"
                  />

                  {draft.is_closed && (
                    <>
                      <ChoiceListEditor>
                        {ensureChoices(draft.choices).map((choice, ci) => {
                          const value = choice ?? "";
                          const isCorrect = (draft.correct_choices || []).includes(value);
                          return (
                            <ChoiceRow key={ci}>
                              <LetterBubble>{String.fromCharCode(65 + ci)}</LetterBubble>

                              <ChoiceInput
                                type="text"
                                value={value}
                                onChange={(e) => updateDraftChoice(ci, e.target.value)}
                                placeholder={`Odpowiedź ${String.fromCharCode(65 + ci)}`}
                              />

                              <CorrectToggle
                                type="button"
                                $active={isCorrect}
                                onClick={() => toggleDraftCorrect(value, !isCorrect)}
                                title={isCorrect ? "Usuń oznaczenie poprawnej" : "Oznacz jako poprawną"}
                              >
                                {isCorrect ? "Poprawna" : "Ustaw jako poprawną"}
                              </CorrectToggle>
                              <TrashBtn
                                type="button"
                                onClick={() => removeChoiceRow(ci)}
                                title="Usuń odpowiedź"
                                aria-label="Usuń odpowiedź"
                              >
                                <img src={trashIcon} alt="" />
                              </TrashBtn>
                            </ChoiceRow>
                          );
                        })}
                      </ChoiceListEditor>

                      <AddChoiceBtn type="button" onClick={addDraftChoiceRow}>
                        + Dodaj odpowiedź
                      </AddChoiceBtn>
                    </>
                  )}

                  {!draft.is_closed && (
                    <div
                      style={{
                        marginTop: 10,
                        fontSize: 12,
                        color: "#6b7280",
                        fontStyle: "italic",
                      }}
                    >
                      Pytanie otwarte — odpowiedź udzielana przez zdającego.
                    </div>
                  )}
                  {missingCorrectLive && !editorError && (
                    <ErrorNote>Zaznacz przynajmniej jedną poprawną odpowiedź.</ErrorNote>
                  )}

                  {editorError && <ErrorNote>{editorError}</ErrorNote>}
                  <EditorActions>
                    <PrimaryButton onClick={handleSaveEdit} disabled={savingEdit}>Zapisz</PrimaryButton>
                    <DangerButton onClick={cancelEdit}>Anuluj</DangerButton>
                  </EditorActions>
                </EditorCard>
              </QuestionItem>

              );
            }
            // VIEW MODE
            return (
              <QuestionItem key={q.id}>
                <QuestionHeaderRow>
                  <QuestionTitle style={{ marginBottom: 6 }}>
                    <span style={{ marginRight: 6 }}>{idx + 1}.</span>
                    <MathText text={q.text} />
                  </QuestionTitle>
                  <QuestionMeta>
                    <DifficultyBadge $level={q.difficulty}>
                      {getDifficultyLabel(q.difficulty)}
                    </DifficultyBadge>
                    <TypeBadge $closed={q.is_closed}>
                      {q.is_closed ? "Zamknięte" : "Otwarte"}
                    </TypeBadge>
                  </QuestionMeta>
                </QuestionHeaderRow>

                {q.is_closed && (
                  <ChoiceList style={{ marginTop: 12 }}>
                    {toArray(q.choices).map((choice, ci) => {
                      const isCorrect = toArray(
                        q.correct_choices
                      ).includes(choice);
                      return (
                        <ChoiceItem key={ci} $correct={isCorrect}>
                          <span style={{ marginRight: 6 }}>
                            {String.fromCharCode(65 + ci)}.
                          </span>
                          <MathText text={choice} />
                        </ChoiceItem>
                      );
                    })}
                  </ChoiceList>
                )}

                {!q.is_closed && (
                  <textarea
                    readOnly
                    value=""
                    placeholder="Odpowiedź otwarta…"
                    style={{
                      marginTop: 12,
                      width: "100%",
                      minHeight: 60,
                      borderRadius: 8,
                      border: "1px dashed #ccc",
                      padding: "6px 8px",
                    }}
                  />
                )}

                <QuestionActions>
                  <EditButton onClick={() => startEdit(q)}>
                    Edytuj
                  </EditButton>
                  <DangerButton onClick={() => handleDelete(q.id)}>
                    Usuń
                  </DangerButton>
                </QuestionActions>
              </QuestionItem>
            );
          })}
        </QuestionList>

        <AddQuestionBar>
          <AddQuestionButton onClick={startAdd}>
            + Dodaj pytanie
          </AddQuestionButton>
        </AddQuestionBar>
          {isAdding && (
            <QuestionItem>
              <EditorCard>
                <EditorToolbar>
                  <Segmented>
                    <button
                      className={draft.is_closed ? "is-active-closed" : ""}
                      onClick={() => toggleDraftClosed(true)}
                      type="button"
                    >
                      Zamknięte
                    </button>
                    <button
                      className={!draft.is_closed ? "is-active-open" : ""}
                      onClick={() => toggleDraftClosed(false)}
                      type="button"
                    >
                      Otwarte
                    </button>
                  </Segmented>

                  <NiceSelect
                    value={draft.difficulty || 1}
                    onChange={(e) => setDraftDifficulty(Number(e.target.value))}
                    aria-label="Poziom trudności"
                  >
                    <option value={1}>Łatwe</option>
                    <option value={2}>Średnie</option>
                    <option value={3}>Trudne</option>
                  </NiceSelect>
                </EditorToolbar>

                <EditorTextarea
                  value={draft.text || ""}
                  onChange={(e) => onTextChange(e.target.value)}
                  placeholder="Wpisz treść pytania…"
                />

                <Divider />

                {draft.is_closed ? (
                  <>
                    <ChoiceListEditor>
                      {ensureChoices(draft.choices).map((choice, ci) => {
                        const value = choice ?? "";
                        const isCorrect = (draft.correct_choices || []).includes(value);
                        return (
                          <ChoiceRow key={ci}>
                            <LetterBubble>{String.fromCharCode(65 + ci)}</LetterBubble>

                            <ChoiceInput
                              type="text"
                              value={value}
                              onChange={(e) => updateDraftChoice(ci, e.target.value)}
                              placeholder={`Odpowiedź ${String.fromCharCode(65 + ci)}`}
                            />

                            <CorrectToggle
                              type="button"
                              $active={isCorrect}
                              onClick={() => {
                                const v = ensureChoices(draft.choices)[ci] ?? "";
                                // przełącz poprawność po aktualnej wartości
                                toggleDraftCorrect(v, !isCorrect);
                              }}
                              title={isCorrect ? "Usuń oznaczenie poprawnej" : "Oznacz jako poprawną"}
                            >
                              {isCorrect ? "Poprawna" : "Ustaw jako poprawną"}
                            </CorrectToggle>
                              <TrashBtn
                                type="button"
                                onClick={() => removeChoiceRow(ci)}
                                title="Usuń odpowiedź"
                                aria-label="Usuń odpowiedź"
                              >
                                <img src={trashIcon} alt="" />
                              </TrashBtn>
                          </ChoiceRow>
                        );
                      })}
                    </ChoiceListEditor>

                    <AddChoiceBtn type="button" onClick={addDraftChoiceRow}>
                      + Dodaj odpowiedź
                    </AddChoiceBtn>

                    <EditorHint>
                      Zaznacz przynajmniej jedną poprawną odpowiedź, aby zapisać pytanie zamknięte.
                    </EditorHint>
                  </>
                ) : (
                  <EditorHint>
                    Pytanie otwarte — odpowiedź udzielana przez zdającego.
                  </EditorHint>
                )}
                {missingCorrectLive && !editorError && (
                  <ErrorNote>Zaznacz przynajmniej jedną poprawną odpowiedź.</ErrorNote>
                )}
                {editorError && <ErrorNote>{editorError}</ErrorNote>}

                <EditorActions>
                  <PrimaryButton onClick={handleAdd} disabled={savingAdd}>
                    Zapisz
                  </PrimaryButton>
                  <DangerButton onClick={cancelEdit}>Anuluj</DangerButton>
                </EditorActions>
              </EditorCard>
            </QuestionItem>
          )}
        <DownloadBar>
          <DownloadButton
            onClick={handleDownloadCustomPdf}
          >
            Pobierz PDF
          </DownloadButton>
          <DownloadButton
            onClick={() =>
              download(
                `${API}/tests/${testIdNum}/export/xml`,
                `test_${testIdNum}.xml`
              )
            }
          >
            Pobierz XML
          </DownloadButton>
          <AiWarningBox>
            <span>
              Test został wygenerowany przez AI i może zawierać błędy.
              Zweryfikuj go przed pobraniem.
            </span>
          </AiWarningBox>
        </DownloadBar>

        <ConfigSection>
          <SectionCard>
              <CollapsibleSection
                title="Personalizacja PDF (opcjonalne)"
                hint="Ustaw parametry eksportu przed pobraniem."
                isOpen={pdfConfigOpen}
                onToggle={() => setPdfConfigOpen((v) => !v)}
                isActive={
                  pdfConfig.answer_space_style !== "blank" ||
                  pdfConfig.space_height_cm !== 3 ||
                  pdfConfig.include_answer_key ||
                  pdfConfig.generate_variants ||
                  pdfConfig.use_scratchpad ||
                  !pdfConfig.mark_multi_choice
                }
              >
              <Divider style={{ margin: "8px 0 16px" }} />
              <ConfigGrid>
                <ConfigField>
                  <label>Styl pola odpowiedzi</label>
                  <PdfConfigSelect
                    value={pdfConfig.answer_space_style}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setPdfConfig((cfg) => ({
                        ...cfg,
                        answer_space_style: e.target
                          .value as PdfExportConfig["answer_space_style"],
                      }))
                    }
                  >
                    <option value="blank">Puste miejsce</option>
                    <option value="lines">Linie do pisania</option>
                    <option value="grid">Kratka</option>
                  </PdfConfigSelect>
                </ConfigField>

                <ConfigField>
                  <label>Wysokość pola odpowiedzi (cm)</label>
                  <PdfConfigNumberInput
                    type="number"
                    min={1}
                    max={10}
                    step={0.5}
                    value={pdfConfig.space_height_cm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPdfConfig((cfg) => ({
                        ...cfg,
                        space_height_cm: Math.max(
                          1,
                          Math.min(10, Number(e.target.value) || 1)
                        ),
                      }))
                    }
                  />
                </ConfigField>

                <ConfigField>
                  <Checkbox
                    id="pdf-student-header"
                    checked={pdfConfig.student_header}
                    onChange={(checked) =>
                      setPdfConfig((cfg) => ({
                        ...cfg,
                        student_header: checked,
                      }))
                    }
                    label="Dodaj linię na imię i nazwisko ucznia."
                  />
                </ConfigField>

                <ConfigField>
                  <Checkbox
                    id="pdf-include-answer-key"
                    checked={pdfConfig.include_answer_key}
                    onChange={(checked) =>
                      setPdfConfig((cfg) => ({
                        ...cfg,
                        include_answer_key: checked,
                      }))
                    }
                    label="Dołącz klucz odpowiedzi do pytań zamkniętych."
                  />
                </ConfigField>

                <ConfigField>
                  <Checkbox
                    id="pdf-scratchpad"
                    checked={pdfConfig.use_scratchpad}
                    onChange={(checked) =>
                      setPdfConfig((cfg) => ({
                        ...cfg,
                        use_scratchpad: checked,
                      }))
                    }
                    label="Dodaj stronę w kratkę (brudnopis)."
                  />
                </ConfigField>

                <ConfigField>
                  <Checkbox
                    id="pdf-generate-variants"
                    checked={pdfConfig.generate_variants}
                    onChange={(checked) =>
                      setPdfConfig((cfg) => ({
                        ...cfg,
                        generate_variants: checked,
                      }))
                    }
                    label="Wygeneruj dwie wersje (Grupa A i B)."
                  />
                </ConfigField>

                <ConfigField>
                  <Checkbox
                    id="pdf-mark-multi-choice"
                    checked={pdfConfig.mark_multi_choice}
                    onChange={(checked) =>
                      setPdfConfig((cfg) => ({
                        ...cfg,
                        mark_multi_choice: checked,
                      }))
                    }
                    label="Oznacz graficznie pytania wielokrotnego wyboru."
                  />
                </ConfigField>

                <div />
              </ConfigGrid>

              <ConfigActions>
                <GhostButton
                  type="button"
                  onClick={() =>
                    setPdfConfig({
                      answer_space_style: "blank",
                      space_height_cm: 3,
                      include_answer_key: false,
                      generate_variants: false,
                      swap_order_variants: null,
                      student_header: true,
                      use_scratchpad: false,
                      mark_multi_choice: true,
                    })
                  }
                >
                  Przywróć domyślne
                </GhostButton>
                <PrimaryButton onClick={handleDownloadCustomPdf}>
                  Pobierz PDF z tymi ustawieniami
                </PrimaryButton>
              </ConfigActions>
            </CollapsibleSection>
          </SectionCard>
        </ConfigSection>

        <Footer />
        {testIdToDelete !== null && (
        <ConfirmationModal
          onCancel={handleCloseModal}
          onConfirm={handleConfirmDelete}
        />
        )}
        </InnerWrapper>
      </ContentWrapper>
    </PageWrapper>
  );
};

export default TestDetailPage;
