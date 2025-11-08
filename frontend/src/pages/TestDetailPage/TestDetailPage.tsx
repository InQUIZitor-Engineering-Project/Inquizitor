import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import {
  getMyTests,
  getTestDetail,
  addQuestion,
  updateQuestion,
  deleteQuestion,
} from "../../services/test";
import type { TestDetail, TestOut, QuestionOut } from "../../services/test";
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
  MetaControls,
  MetaSelect,
  MetaToggle,
  QuestionActions,
  PrimaryButton,
  DangerButton,
  GhostButton,
  EditButton,
  AddQuestionBar,
  AddQuestionButton,
  DownloadBar,
  DownloadButton
} from "./TestDetailPage.styles";

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

// --- component ---

const TestDetailPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const testIdNum = Number(testId);
  const navigate = useNavigate();

  const [data, setData] = useState<TestDetail | null>(null);
  const [tests, setTests] = useState<TestOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Partial<QuestionOut>>({});
  const [isAdding, setIsAdding] = useState(false);

  const token = localStorage.getItem("access_token");

  const download = (url: string, filename: string) => {
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return r.blob();
      })
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch((e) => alert(`Nie udało się pobrać pliku: ${e.message}`));
  };

  useEffect(() => {
    if (!testId) return;
    const id = Number(testId);
    if (!Number.isFinite(id)) {
      setError("Nieprawidłowe ID testu");
      return;
    }
    setLoading(true);
    Promise.all([getTestDetail(id), getMyTests()])
      .then(([detail, testsList]) => {
        setData(detail);
        setTests(testsList);
        setError(null);
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
    setIsAdding(false);
    setDraft({});
  };

  const handleSaveEdit = async () => {
    if (!data || editingId == null) return;
    try {
      const payload: any = {
        text: draft.text,
        is_closed: !!draft.is_closed,
        difficulty: draft.difficulty || 1,
      };

      if (payload.is_closed) {
        const cleanedChoices = (draft.choices || [])
          .map((c) => (c || "").trim())
          .filter((c) => c);
        const cleanedCorrect = (draft.correct_choices || []).filter((c) =>
          cleanedChoices.includes(c)
        );
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
    }
  };

  const handleAdd = async () => {
    if (!data) return;
    try {
      const payload: any = {
        text: (draft.text || "").trim(),
        is_closed: !!draft.is_closed,
        difficulty: draft.difficulty || 1,
      };

      if (!payload.text) {
        alert("Podaj treść pytania");
        return;
      }

      if (payload.is_closed) {
        const cleanedChoices = (draft.choices || [])
          .map((c) => (c || "").trim())
          .filter((c) => c);
        if (cleanedChoices.length === 0) {
          alert("Dodaj przynajmniej jedną odpowiedź");
          return;
        }
        const cleanedCorrect = (draft.correct_choices || []).filter((c) =>
          cleanedChoices.includes(c)
        );
        if (cleanedCorrect.length === 0) {
          alert("Zaznacz przynajmniej jedną poprawną odpowiedź");
          return;
        }
        payload.choices = cleanedChoices;
        payload.correct_choices = cleanedCorrect;
      } else {
        payload.choices = null;
        payload.correct_choices = null;
      }

      await addQuestion(data.test_id, payload);
      await refreshTest(); // nowe pytanie na końcu
      cancelEdit();
    } catch (e: any) {
      alert(e.message || "Nie udało się dodać pytania");
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

  const updateDraftChoice = (index: number, value: string) => {
    setDraft((d) => {
      const choices = ensureChoices(d.choices);
      choices[index] = value;
      return { ...d, choices };
    });
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
  };

  const addDraftChoiceRow = () => {
    setDraft((d) => ({
      ...d,
      choices: [...ensureChoices(d.choices), ""],
    }));
  };

  if (loading) return <PageWrapper>Ładowanie…</PageWrapper>;
  if (error) return <PageWrapper>Błąd: {error}</PageWrapper>;
  if (!data) return null;

  const closedCount = data.questions.filter((q) => q.is_closed).length;
  const openCount = data.questions.length - closedCount;

  return (
    <PageWrapper>
      <Sidebar
        tests={tests}
        onSelect={(testId) => navigate(`/tests/${testId}`)}
        onCreateNew={() => navigate(`/tests/new`)}
      />

      <ContentWrapper>
        <Header>{data.title}</Header>
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

        <QuestionList>
          {data.questions.map((q, idx) => {
            const isEditing = editingId === q.id;

            if (isEditing) {
              return (
                <QuestionItem key={q.id}>
                  <QuestionHeaderRow>
                    <QuestionTitle>
                      {idx + 1}.{" "}
                      <textarea
                        value={draft.text || ""}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, text: e.target.value }))
                        }
                        style={{
                          width: "100%",
                          minHeight: 120, // 🆕 większe pole przy edycji
                          resize: "vertical",
                        }}
                      />
                    </QuestionTitle>
                    <MetaControls>
                      <MetaSelect
                        value={draft.difficulty || 1}
                        onChange={(e) =>
                          setDraftDifficulty(Number(e.target.value))
                        }
                      >
                        <option value={1}>Łatwe</option>
                        <option value={2}>Średnie</option>
                        <option value={3}>Trudne</option>
                      </MetaSelect>
                      <div>
                        <MetaToggle
                          className={
                            draft.is_closed ? "active-closed" : ""
                          }
                          onClick={() => toggleDraftClosed(true)}
                          type="button"
                        >
                          Zamknięte
                        </MetaToggle>
                        <MetaToggle
                          className={
                            draft.is_closed ? "" : "active-open"
                          }
                          onClick={() => toggleDraftClosed(false)}
                          type="button"
                          style={{ marginLeft: 4 }}
                        >
                          Otwarte
                        </MetaToggle>
                      </div>
                    </MetaControls>
                  </QuestionHeaderRow>

                  {draft.is_closed && (
                    <ChoiceList style={{ marginTop: 12 }}>
                      {ensureChoices(draft.choices).map((choice, ci) => {
                        const value = choice ?? "";
                        const isCorrect = (draft.correct_choices || []).includes(
                          value
                        );
                        return (
                          <li key={ci} style={{ marginBottom: 6 }}>
                            <label
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isCorrect}
                                onChange={(e) =>
                                  toggleDraftCorrect(
                                    value,
                                    e.target.checked
                                  )
                                }
                              />
                              <input
                                type="text"
                                value={value}
                                onChange={(e) =>
                                  updateDraftChoice(ci, e.target.value)
                                }
                                placeholder={`Odpowiedź ${String.fromCharCode(
                                  65 + ci
                                )}`}
                                style={{
                                  flex: 1,
                                  padding: "6px 8px",
                                  borderRadius: 8,
                                  border: "1px solid #ddd",
                                }}
                              />
                            </label>
                          </li>
                        );
                      })}
                      <li>
                        <GhostButton
                          type="button"
                          onClick={addDraftChoiceRow}
                        >
                          + Dodaj odpowiedź
                        </GhostButton>
                      </li>
                    </ChoiceList>
                  )}

                  {!draft.is_closed && (
                    <div
                      style={{
                        marginTop: 12,
                        fontSize: 12,
                        color: "#777",
                        fontStyle: "italic",
                      }}
                    >
                      Pytanie otwarte — odpowiedź nie jest tutaj edytowana,
                      będzie wpisywana przez zdającego.
                    </div>
                  )}

                  <QuestionActions>
                    <PrimaryButton onClick={handleSaveEdit}>
                      Zapisz
                    </PrimaryButton>
                    <DangerButton onClick={cancelEdit}>
                      Anuluj
                    </DangerButton>
                  </QuestionActions>
                </QuestionItem>
              );
            }

            // VIEW MODE
            return (
              <QuestionItem key={q.id}>
                <QuestionHeaderRow>
                  <QuestionTitle style={{ marginBottom: 6 }}>
                    {idx + 1}. {q.text}
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
                          {String.fromCharCode(65 + ci)}. {choice}
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
            <QuestionHeaderRow>
              <QuestionTitle>
                <textarea
                  value={draft.text || ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, text: e.target.value }))
                  }
                  placeholder="Treść nowego pytania"
                  style={{
                    width: "100%",
                    minHeight: 120, // 🆕 większe pole dla nowego pytania
                    resize: "vertical",
                  }}
                />
              </QuestionTitle>
              <MetaControls>
                <MetaSelect
                  value={draft.difficulty || 1}
                  onChange={(e) =>
                    setDraftDifficulty(Number(e.target.value))
                  }
                >
                  <option value={1}>Łatwe</option>
                  <option value={2}>Średnie</option>
                  <option value={3}>Trudne</option>
                </MetaSelect>
                <div>
                  <MetaToggle
                    className={draft.is_closed ? "active-closed" : ""}
                    onClick={() => toggleDraftClosed(true)}
                    type="button"
                  >
                    Zamknięte
                  </MetaToggle>
                  <MetaToggle
                    className={draft.is_closed ? "" : "active-open"}
                    onClick={() => toggleDraftClosed(false)}
                    type="button"
                    style={{ marginLeft: 4 }}
                  >
                    Otwarte
                  </MetaToggle>
                </div>
              </MetaControls>
            </QuestionHeaderRow>

            {draft.is_closed && (
              <ChoiceList style={{ marginTop: 12 }}>
                {ensureChoices(draft.choices).map((choice, ci) => {
                  const value = choice ?? "";
                  const isCorrect = (draft.correct_choices || []).includes(
                    value
                  );
                  return (
                    <li key={ci} style={{ marginBottom: 6 }}>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isCorrect}
                          onChange={(e) =>
                            toggleDraftCorrect(value, e.target.checked)
                          }
                        />
                        <input
                          type="text"
                          value={value}
                          onChange={(e) =>
                            updateDraftChoice(ci, e.target.value)
                          }
                          placeholder={`Odpowiedź ${String.fromCharCode(
                            65 + ci
                          )}`}
                          style={{
                            flex: 1,
                            padding: "6px 8px",
                            borderRadius: 8,
                            border: "1px solid #ddd",
                          }}
                        />
                      </label>
                    </li>
                  );
                })}
                <li>
                  <GhostButton type="button" onClick={addDraftChoiceRow}>
                    + Dodaj odpowiedź
                  </GhostButton>
                </li>
              </ChoiceList>
            )}

            {!draft.is_closed && (
              <div
                style={{
                  marginTop: 12,
                  fontSize: 12,
                  color: "#777",
                  fontStyle: "italic",
                }}
              >
                Pytanie otwarte — poprawność będzie oceniana ręcznie.
              </div>
            )}

            <QuestionActions>
              <PrimaryButton onClick={handleAdd}>Zapisz</PrimaryButton>
              <DangerButton onClick={cancelEdit}>Anuluj</DangerButton>
            </QuestionActions>
          </QuestionItem>
        )}

        <DownloadBar>
          <DownloadButton
            onClick={() =>
              download(
                `${API}/tests/${testIdNum}/export/pdf?show_answers=false`,
                `test_${testIdNum}.pdf`
              )
            }
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
        </DownloadBar>

        <Footer />
      </ContentWrapper>
    </PageWrapper>
  );
};

export default TestDetailPage;
