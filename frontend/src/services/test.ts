// src/services/test.ts

export interface TestOut {
  id: number;
  title: string;
  created_at: string;
}

export interface GenerateParams {
  num_closed: number;
  num_open: number;
  closed_types?: Array<"true_false" | "single_choice" | "multi_choice">;
  easy: number;
  medium: number;
  hard: number;
  text?: string;
  file_id?: number;
}

export interface TestGenerateResponse {
  test_id: number;
  num_questions: number;
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

// ---- Nowe payloady do pytań ----

export interface QuestionCreatePayload {
  text: string;
  is_closed: boolean;
  difficulty: number;
  choices?: string[] | null;
  correct_choices?: string[] | null;
}

export type QuestionUpdatePayload = Partial<QuestionCreatePayload>;

const API_BASE = import.meta.env.VITE_API_URL || "";

// --- helpers ---

function getToken() {
  return localStorage.getItem("access_token");
}

function getAuthHeaders(json: boolean = true): HeadersInit {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (json) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

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
  const res = await fetch(`${API_BASE}/users/me/tests`, {
    headers: getAuthHeaders(),
  });
  return handleJson<TestOut[]>(res, "Nie udało się pobrać listy testów");
}

export async function generateTest(
  params: GenerateParams
): Promise<TestGenerateResponse> {
  const res = await fetch(`${API_BASE}/tests/generate`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(params),
  });
  return handleJson<TestGenerateResponse>(res, "Błąd generowania testu");
}

export async function getTestDetail(testId: number): Promise<TestDetail> {
  const res = await fetch(`${API_BASE}/tests/${testId}`, {
    headers: getAuthHeaders(),
  });
  return handleJson<TestDetail>(res, "Nie udało się pobrać testu");
}

// --- NOWE: zarządzanie pytaniami ---

export async function addQuestion(
  testId: number,
  payload: QuestionCreatePayload
): Promise<QuestionOut> {
  const res = await fetch(`${API_BASE}/tests/${testId}/questions`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleJson<QuestionOut>(res, "Nie udało się dodać pytania");
}

export async function updateQuestion(
  testId: number,
  questionId: number,
  payload: QuestionUpdatePayload
): Promise<QuestionOut> {
  const res = await fetch(
    `${API_BASE}/tests/${testId}/edit/${questionId}`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
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
  const res = await fetch(
    `${API_BASE}/tests/${testId}/questions/${questionId}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(false),
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
