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

const API_BASE = import.meta.env.VITE_API_URL || "";

export async function getMyTests(): Promise<TestOut[]> {
  const token = localStorage.getItem("access_token");
  const res = await fetch(`${API_BASE}/users/me/tests`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw new Error("Nie udało się pobrać listy testów");
  }
  return res.json();
}


export async function generateTest(
  params: GenerateParams
): Promise<TestGenerateResponse> {
  const token = localStorage.getItem("access_token");
  const res = await fetch(`${API_BASE}/tests/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Błąd generowania testu");
  }
  return res.json();
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

export async function getTestDetail(testId: number): Promise<TestDetail> {
  const token = localStorage.getItem("access_token");
  const res = await fetch(`${API_BASE}/tests/${testId}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw new Error("Nie udało się pobrać testu");
  }
  return res.json();
}


