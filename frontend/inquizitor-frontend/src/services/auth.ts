export interface UserCreate {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

export interface UserRead {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

const API_BASE = import.meta.env.VITE_API_URL || "";

export async function registerUser(data: UserCreate): Promise<UserRead> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Coś poszło nie tak");
  }
  return res.json();
}

export async function loginUser(
  email: string,
  password: string
): Promise<Token> {
  const form = new URLSearchParams();
  form.append("username", email);
  form.append("password", password);

  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Niepoprawny email lub hasło");
  }
  return res.json();
}
