// src/services/test.ts

export interface TestOut {
  id: number;
  title: string;
  created_at: string;
}

export interface JobEnqueueResponse {
  job_id: number;
  status: string;
}

export interface JobOut {
  id: number;
  owner_id: number;
  job_type: string;
  status: string;
  payload: Record<string, any>;
  result?: Record<string, any> | null;
  error?: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuestionOut {
  id: number;
  text: string;
  is_closed: boolean;
  difficulty: number;
  choices?: string[];
  correct_choices?: string[];
}

export interface TestDetail {
  test_id: number;
  title: string;
  questions: QuestionOut[];
}

export type AnswerSpaceStyle = "grid" | "lines" | "blank";

export interface PdfExportConfig {
  answer_space_style: AnswerSpaceStyle;
  space_height_cm: number;
  include_answer_key: boolean;
  generate_variants: boolean;
  variant_mode?: "shuffle" | "llm_variant";
  swap_order_variants?: boolean | null;
  student_header: boolean;
  use_scratchpad: boolean;
  mark_multi_choice: boolean;
}

// ---- Nowe payloady do pytań ----

export interface QuestionCreatePayload {
  text: string;
  is_closed: boolean;
  difficulty: number;
  choices?: string[] | null;
  correct_choices?: string[] | null;
}

export type QuestionUpdatePayload = Partial<QuestionCreatePayload>;

export interface BulkUpdatePayload {
  question_ids: number[];
  difficulty?: number;
  is_closed?: boolean;
}

export interface BulkDeletePayload {
  question_ids: number[];
}

export interface BulkRegeneratePayload {
  question_ids: number[];
  instruction?: string;
}

export interface BulkConvertPayload {
  question_ids: number[];
  target_type: "open" | "closed";
}

import { apiRequest } from "./api";

async function handleJson<T>(res: Response, defaultMessage: string): Promise<T> {
  if (!res.ok) {
    let msg = defaultMessage;
    try {
      const data = await res.json();
      if (data?.detail) msg = data.detail;
    } catch {
      // ignore parse error
    }
    throw new Error(msg);
  }
  return res.json();
}

// --- istniejące ---

export async function getMyTests(): Promise<TestOut[]> {
  const res = await apiRequest(`/users/me/tests`);
  return handleJson<TestOut[]>(res, "Nie udało się pobrać listy testów");
}

export interface ClosedCounts {
  true_false: number;
  single_choice: number;
  multi_choice: number;
}

export interface GenerateParams {
  closed: ClosedCounts;
  num_open: number;
  easy: number;
  medium: number;
  hard: number;
  text?: string;
  additional_instructions?: string;
  file_id?: number;
}

export async function generateTest(
  params: GenerateParams
): Promise<JobEnqueueResponse> {
  const res = await apiRequest(`/tests/generate`, {
    method: "POST",
    body: JSON.stringify(params),
  });
  return handleJson<JobEnqueueResponse>(res, "Błąd generowania testu");
}

export async function getTestDetail(testId: number): Promise<TestDetail> {
  const res = await apiRequest(`/tests/${testId}`);
  return handleJson<TestDetail>(res, "Nie udało się pobrać testu");
}
export async function updateTestTitle(testId: number, title: string) {
  const res = await apiRequest(`/tests/${testId}/title`, {
    method: "PATCH",
    body: JSON.stringify({ title }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || "Nie udało się zaktualizować tytułu");
  }
  return res.json();
}

// --- NOWE: zarządzanie pytaniami ---

export async function addQuestion(
  testId: number,
  payload: QuestionCreatePayload
): Promise<QuestionOut> {
  const res = await apiRequest(`/tests/${testId}/questions`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return handleJson<QuestionOut>(res, "Nie udało się dodać pytania");
}

export async function updateQuestion(
  testId: number,
  questionId: number,
  payload: QuestionUpdatePayload
): Promise<QuestionOut> {
  const res = await apiRequest(
    `/tests/${testId}/edit/${questionId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
  // backend aktualnie zwraca {"msg": "Question updated"} – jeśli go nie zmienisz,
  // możesz tutaj zamiast tego zrobić ponowne pobranie pytania/testu.
  // Zakładamy, że zaktualizujesz endpoint tak, by zwracał QuestionOut.
  return handleJson<QuestionOut>(res, "Nie udało się zaktualizować pytania");
}

export async function deleteQuestion(
  testId: number,
  questionId: number
): Promise<void> {
  const res = await apiRequest(
    `/tests/${testId}/questions/${questionId}`,
    {
      method: "DELETE",
    }
  );
  if (!res.ok) {
    let msg = "Nie udało się usunąć pytania";
    try {
      const data = await res.json();
      if (data?.detail) msg = data.detail;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }
}

export async function bulkUpdateQuestions(
  testId: number,
  payload: BulkUpdatePayload
): Promise<void> {
  const res = await apiRequest(`/tests/${testId}/questions/bulk`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Nie udało się zaktualizować pytań");
  }
}

export async function bulkDeleteQuestions(
  testId: number,
  payload: BulkDeletePayload
): Promise<void> {
  const res = await apiRequest(`/tests/${testId}/questions/bulk`, {
    method: "DELETE",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Nie udało się usunąć pytań");
  }
}

export async function bulkRegenerateQuestions(
  testId: number,
  payload: BulkRegeneratePayload
): Promise<JobEnqueueResponse> {
  const res = await apiRequest(`/tests/${testId}/questions/bulk/regenerate`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return handleJson<JobEnqueueResponse>(res, "Nie udało się zainicjować regeneracji pytań");
}

export async function bulkConvertQuestions(
  testId: number,
  payload: BulkConvertPayload
): Promise<JobEnqueueResponse> {
  const res = await apiRequest(`/tests/${testId}/questions/bulk/convert`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return handleJson<JobEnqueueResponse>(res, "Nie udało się zainicjować konwersji pytań");
}

export async function deleteTest(
  testId: number,
): Promise<void> {
  const res = await apiRequest(
    `/tests/${testId}`,
    {
      method: "DELETE",
    }
  );
  if (!res.ok) {
    let msg = "Nie udało się usunąć testu";
    try {
      const data = await res.json();
      if (data?.detail) msg = data.detail;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }
}

export async function exportCustomPdf(
  testId: number,
  config: PdfExportConfig
): Promise<JobEnqueueResponse> {
  const res = await apiRequest(`/tests/${testId}/export/pdf/custom`, {
    method: "POST",
    body: JSON.stringify(config),
  });

  return handleJson<JobEnqueueResponse>(res, "Nie udało się zainicjować eksportu PDF");
}

export async function exportPdf(
  testId: number,
  showAnswers: boolean = false
): Promise<JobEnqueueResponse> {
  const res = await apiRequest(`/tests/${testId}/export/pdf?show_answers=${showAnswers}`, {
    method: "GET",
  });
  return handleJson<JobEnqueueResponse>(res, "Nie udało się zainicjować eksportu PDF");
}

// Jobs API
export async function getJob(jobId: number): Promise<JobOut> {
  const res = await apiRequest(`/jobs/${jobId}`);
  return handleJson<JobOut>(res, "Nie udało się pobrać statusu zadania");
}
