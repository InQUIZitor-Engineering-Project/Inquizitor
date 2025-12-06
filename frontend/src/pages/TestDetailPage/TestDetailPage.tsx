import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { useLoader } from "../../components/Loader/GlobalLoader";
import ConfirmationModal from "../../components/ConfirmationModal/ConfirmationModal";
import editIcon from "../../assets/icons/edit-icon.png";
import { MathText } from "../../components/MathText/MathText";
import { useTheme } from "styled-components";
import {
  Box,
  Flex,
  Stack,
  Button,
  Textarea,
  Select,
  Input,
  Checkbox,
  Badge,
  Divider,
} from "../../design-system/primitives";
import { FormField, CollapsibleSection, ChoiceEditor, AlertBar } from "../../design-system/patterns";

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
import Footer from "../../components/Footer/Footer";

import {
  Header,
  Meta,
  QuestionList,
  QuestionItem,
  ChoiceList,
  ChoiceItem,
  QuestionHeaderRow,
  QuestionTitle,
  QuestionMeta,
  QuestionActions,
  TitleRow,
  TitleEditIconBtn,
  HeaderInput,
  TitleActions,
  EditorToolbar,
  Segmented,
  EditorActions,
  ErrorNote,
  EditorHint,
  MetaRow,
  ConfigActions,
  ConfigSection,
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

const difficultyOrder: Record<number, number> = { 1: 0, 2: 1, 3: 2 };
const sortQuestions = (qs: QuestionOut[]) =>
  [...qs].sort((a, b) => {
    const oa = difficultyOrder[a.difficulty] ?? 99;
    const ob = difficultyOrder[b.difficulty] ?? 99;
    if (oa !== ob) return oa - ob;
    return (a.id || 0) - (b.id || 0);
  });

const ensureChoices = (choices?: string[] | null): string[] =>
  choices && choices.length > 0 ? choices : ["", "", "", ""];

type LayoutCtx = { refreshSidebarTests: () => Promise<void> };


// --- component ---

const TestDetailPage: React.FC = () => {
  
  const { testId } = useParams<{ testId: string }>();
  const testIdNum = Number(testId);
  const navigate = useNavigate();
  const { withLoader } = useLoader();
  const theme = useTheme();

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
    variant_mode: "shuffle",
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
    await withLoader(async () => {
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
    });
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
            setData({ ...detail, questions: sortQuestions(detail.questions) });
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
    setData({ ...detail, questions: sortQuestions(detail.questions) });
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
        const nextQuestions = prev.questions.map((q) =>
          q.id === editingId ? { ...q, ...payload } : q
        );
        return {
          ...prev,
          questions: sortQuestions(nextQuestions),
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

  const renderShell = (child: React.ReactNode) => (
    <Flex
      $direction="column"
      $height="100%"
      $bg={theme.colors.neutral.silver}
      $overflow="hidden"
    >
      <Box $flex={1} $overflowY="auto" $p={40} $width="100%">
        <Stack style={{ maxWidth: 900, margin: "0 auto", width: "100%" }} $gap="md">
          {child}
        </Stack>
      </Box>
    </Flex>
  );

  if (loading) return renderShell("Ładowanie…");
  if (error) return renderShell(`Błąd: ${error}`);
  if (!data) return null;

  const closedCount = data.questions.filter((q) => q.is_closed).length;
  const openCount = data.questions.length - closedCount;

  const hasAnyChoice = (draft.choices || []).some(c => (c || "").trim().length > 0);
  const hasAnyCorrect = (draft.correct_choices || []).length > 0;

  const canSaveBase = (draft.text || "").trim().length > 0;
  const canSaveNew  = draft.is_closed ? (canSaveBase && hasAnyChoice) : canSaveBase;
  const canSaveEdit = draft.is_closed ? (canSaveBase && hasAnyChoice) : canSaveBase;

  const missingCorrectLive = !!draft.is_closed && hasAnyChoice && !hasAnyCorrect;

  return renderShell(
    <>
        <TitleRow>
          {isEditingTitle ? (
            <>
              <HeaderInput
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                placeholder="Nazwa testu"
              />
              <TitleActions>
                <Button $size="sm" onClick={saveTitle}>
                  Zapisz
                </Button>
                <Button $size="sm" $variant="danger" onClick={cancelTitle}>
                  Anuluj
                </Button>
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

                  <Select
                    value={draft.difficulty || 1}
                    onChange={(e) => setDraftDifficulty(Number(e.target.value))}
                    aria-label="Poziom trudności"
                  >
                    <option value={1}>Łatwe</option>
                    <option value={2}>Średnie</option>
                    <option value={3}>Trudne</option>
                  </Select>
                </EditorToolbar>

                <Textarea
                  $fullWidth
                  $minHeight="140px"
                  value={draft.text || ""}
                  onChange={(e) => onTextChange(e.target.value)}
                  placeholder="Wpisz treść pytania…"
                />

                {draft.is_closed && (
                  <ChoiceEditor
                    items={ensureChoices(draft.choices).map((choice) => {
                      const value = choice ?? "";
                      return {
                        value,
                        isCorrect: (draft.correct_choices || []).includes(value),
                      };
                    })}
                    onChange={(index, value) => updateDraftChoice(index, value)}
                    onToggleCorrect={(index, next) => {
                      const currentValue = ensureChoices(draft.choices)[index] ?? "";
                      toggleDraftCorrect(currentValue, next);
                    }}
                    onRemove={(index) => removeChoiceRow(index)}
                    onAdd={addDraftChoiceRow}
                    addLabel="+ Dodaj odpowiedź"
                  />
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
                  <Button onClick={handleSaveEdit} disabled={savingEdit}>
                    Zapisz
                  </Button>
                  <Button $variant="danger" onClick={cancelEdit}>
                    Anuluj
                  </Button>
                </EditorActions>
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
                    <Badge
                      $variant={
                        q.difficulty === 1 ? "success" : q.difficulty === 2 ? "warning" : "danger"
                      }
                    >
                      {getDifficultyLabel(q.difficulty)}
                    </Badge>
                    <Badge $variant={q.is_closed ? "info" : "brand"}>
                      {q.is_closed ? "Zamknięte" : "Otwarte"}
                    </Badge>
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
                  <Button $variant="success" onClick={() => startEdit(q)}>
                    Edytuj
                  </Button>
                  <Button $variant="danger" onClick={() => handleDelete(q.id)}>
                    Usuń
                  </Button>
                </QuestionActions>
              </QuestionItem>
            );
          })}
        </QuestionList>

        <Flex $justify="center" $mt="lg" $mb="sm">
          <Button $variant="info" $size="lg" onClick={startAdd}>
            + Dodaj pytanie
          </Button>
        </Flex>
          {isAdding && (
            <QuestionItem>
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

                  <Select
                    value={draft.difficulty || 1}
                    onChange={(e) => setDraftDifficulty(Number(e.target.value))}
                    aria-label="Poziom trudności"
                  >
                    <option value={1}>Łatwe</option>
                    <option value={2}>Średnie</option>
                    <option value={3}>Trudne</option>
                  </Select>
                </EditorToolbar>

                <Textarea
                  $fullWidth
                  $minHeight="140px"
                  value={draft.text || ""}
                  onChange={(e) => onTextChange(e.target.value)}
                  placeholder="Wpisz treść pytania…"
                />

                <Divider />

                {draft.is_closed ? (
                  <>
                    <ChoiceEditor
                      items={ensureChoices(draft.choices).map((choice) => {
                        const value = choice ?? "";
                        return {
                          value,
                          isCorrect: (draft.correct_choices || []).includes(value),
                        };
                      })}
                      onChange={(index, value) => updateDraftChoice(index, value)}
                      onToggleCorrect={(index, next) => {
                        const currentValue = ensureChoices(draft.choices)[index] ?? "";
                        toggleDraftCorrect(currentValue, next);
                      }}
                      onRemove={(index) => removeChoiceRow(index)}
                      onAdd={addDraftChoiceRow}
                      addLabel="+ Dodaj odpowiedź"
                    />

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
                  <Button onClick={handleAdd} disabled={savingAdd}>
                    Zapisz
                  </Button>
                  <Button $variant="danger" onClick={cancelEdit}>
                    Anuluj
                  </Button>
                </EditorActions>
            </QuestionItem>
          )}
        <Flex $gap="sm" $mt="lg" $align="center" $wrap="wrap">
          <Button onClick={handleDownloadCustomPdf}>Pobierz PDF</Button>
          <Button
            onClick={() =>
              download(
                `${API}/tests/${testIdNum}/export/xml`,
                `test_${testIdNum}.xml`
              )
            }
          >
            Pobierz XML
          </Button>
          <AlertBar variant="warning">
            Test został wygenerowany przez AI i może zawierać błędy. Zweryfikuj go przed pobraniem.
          </AlertBar>
        </Flex>

        <ConfigSection>
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
            withCard
          >
            <Divider style={{ margin: "8px 0 16px" }} />
            <Box
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: theme.spacing.sm,
                marginBottom: theme.spacing.md,
              }}
            >
              <FormField label="Styl pola odpowiedzi" fullWidth>
                <Select
                  value={pdfConfig.answer_space_style}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setPdfConfig((cfg) => ({
                      ...cfg,
                      answer_space_style: e.target.value as PdfExportConfig["answer_space_style"],
                    }))
                  }
                >
                  <option value="blank">Puste miejsce</option>
                  <option value="lines">Linie do pisania</option>
                  <option value="grid">Kratka</option>
                </Select>
              </FormField>

              <FormField label="Wysokość pola odpowiedzi (cm)" fullWidth>
                <Input
                  $size="sm"
                  type="number"
                  min={1}
                  max={10}
                  step={0.5}
                  value={pdfConfig.space_height_cm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPdfConfig((cfg) => ({
                      ...cfg,
                      space_height_cm: Math.max(1, Math.min(10, Number(e.target.value) || 1)),
                    }))
                  }
                />
              </FormField>
            </Box>

            <FormField fullWidth>
              <Flex $align="center" $gap="xs">
                <Checkbox
                  id="pdf-student-header"
                  checked={pdfConfig.student_header}
                  onChange={(e) =>
                    setPdfConfig((cfg) => ({
                      ...cfg,
                      student_header: e.target.checked,
                    }))
                  }
                />
                <span>Dodaj linię na imię i nazwisko ucznia.</span>
              </Flex>
            </FormField>

            <FormField fullWidth>
              <Flex $align="center" $gap="xs">
                <Checkbox
                  id="pdf-include-answer-key"
                  checked={pdfConfig.include_answer_key}
                  onChange={(e) =>
                    setPdfConfig((cfg) => ({
                      ...cfg,
                      include_answer_key: e.target.checked,
                    }))
                  }
                />
                <span>Dołącz klucz odpowiedzi do pytań zamkniętych.</span>
              </Flex>
            </FormField>

            <FormField fullWidth>
              <Flex $align="center" $gap="xs">
                <Checkbox
                  id="pdf-scratchpad"
                  checked={pdfConfig.use_scratchpad}
                  onChange={(e) =>
                    setPdfConfig((cfg) => ({
                      ...cfg,
                      use_scratchpad: e.target.checked,
                    }))
                  }
                />
                <span>Dodaj brudnopis na końcu testu.</span>
              </Flex>
            </FormField>

            <FormField fullWidth>
              <Flex $align="center" $gap="xs">
                <Checkbox
                  id="pdf-generate-variants"
                  checked={pdfConfig.generate_variants}
                  onChange={(e) =>
                    setPdfConfig((cfg) => ({
                      ...cfg,
                      generate_variants: e.target.checked,
                    }))
                  }
                />
                <span>Wygeneruj dwie wersje (Grupa A i B).</span>
              </Flex>
            </FormField>

            {pdfConfig.generate_variants && (
              <FormField label="Tryb drugiej grupy" fullWidth>
                <Select
                  value={pdfConfig.variant_mode || "shuffle"}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setPdfConfig((cfg) => ({
                      ...cfg,
                      variant_mode: e.target.value as PdfExportConfig["variant_mode"],
                    }))
                  }
                >
                  <option value="shuffle">Przetasuj w obrębie trudności</option>
                  <option value="llm_variant">Nowe pytania o tej samej trudności</option>
                </Select>
              </FormField>
            )}

            <FormField fullWidth>
              <Flex $align="center" $gap="xs">
                <Checkbox
                  id="pdf-mark-multi-choice"
                  checked={pdfConfig.mark_multi_choice}
                  onChange={(e) =>
                    setPdfConfig((cfg) => ({
                      ...cfg,
                      mark_multi_choice: e.target.checked,
                    }))
                  }
                />
                <span>Oznacz graficznie pytania wielokrotnego wyboru.</span>
              </Flex>
            </FormField>

            <ConfigActions>
              <Button
                $variant="ghost"
                type="button"
                onClick={() =>
                  setPdfConfig({
                    answer_space_style: "blank",
                    space_height_cm: 3,
                    include_answer_key: false,
                    generate_variants: false,
                    variant_mode: "shuffle",
                    swap_order_variants: null,
                    student_header: true,
                    use_scratchpad: false,
                    mark_multi_choice: true,
                  })
                }
              >
                Przywróć domyślne
              </Button>
              <Button onClick={handleDownloadCustomPdf}>
                Pobierz PDF z tymi ustawieniami
              </Button>
            </ConfigActions>
          </CollapsibleSection>
        </ConfigSection>

        <Footer />
        {testIdToDelete !== null && (
        <ConfirmationModal
          onCancel={handleCloseModal}
          onConfirm={handleConfirmDelete}
        />
        )}
    </>
  );
};

export default TestDetailPage;
