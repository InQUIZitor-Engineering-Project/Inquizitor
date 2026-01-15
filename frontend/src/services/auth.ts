import { apiRequest } from "./api";

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
  refresh_token: string;
  token_type: string;
}

export interface RegistrationRequested {
  message: string;
}

export interface VerificationResponse extends Token {
  redirect_url?: string | null;
}

function toPolishEmailError(msg: string): string {
  const m = msg.toLowerCase();

  if (m.includes("special-use or reserved name")) {
    return "Domena adresu e-mail jest zarezerwowana do celów testowych i nie może być użyta.";
  }
  if (m.includes("value is not a valid email address")) {
    return "Wpisz poprawny adres e-mail.";
  }
  if (m.includes("must have exactly one @")) {
    return "Adres e-mail musi zawierać dokładnie jeden znak „@”.";
  }
  if (m.includes("there must be something before the @")) {
    return "Przed znakiem „@” musi znajdować się nazwa użytkownika.";
  }
  if (m.includes("the part after the @-sign is not valid") || m.includes("domain name is not valid")) {
    return "Część domenowa (po „@”) jest nieprawidłowa.";
  }
  if (m.includes("domain name does not exist") || m.includes("no mx record")) {
    return "Domena adresu e-mail nie istnieje lub nie ma poprawnej konfiguracji.";
  }
  if (m.includes("already registered")) {
    return "Ten adres e-mail jest już zarejestrowany.";
  }
  return "Nieprawidłowy adres e-mail.";
}

function translateError(detail: any): string {
  if (Array.isArray(detail) && detail.length) {
    const emailItem = detail.find((e: any) =>
      Array.isArray(e?.loc) && e.loc.includes("email")
    );
    if (emailItem?.msg) return toPolishEmailError(String(emailItem.msg));

    const firstMsg = String(detail[0]?.msg ?? "");
    return toPolishEmailError(firstMsg) || "Błąd formularza.";
  }

  if (typeof detail === "string") {
    if (detail.toLowerCase().includes("email already registered")) {
      return "Ten adres e-mail jest już zarejestrowany.";
    }
    return toPolishEmailError(detail) || "Coś poszło nie tak.";
  }

  return "Coś poszło nie tak.";
}

export async function registerUser(data: UserCreate): Promise<RegistrationRequested> {
  const res = await apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    let message = "Coś poszło nie tak";
    try {
      const err = await res.json();
      message = translateError(err.detail);
    }
    catch {
    }
    throw new Error(message);
  }
  return res.json();
}

export async function verifyEmail(token: string, redirect: boolean = false): Promise<VerificationResponse> {
  const params = new URLSearchParams();
  params.set("token", token);
  if (redirect) params.set("redirect", "true");

  const res = await apiRequest(`/auth/verify-email?${params.toString()}`, { 
    method: "GET" 
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Nie udało się zweryfikować adresu e-mail.");
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

  const res = await apiRequest("/auth/login", {
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

export async function requestPasswordReset(email: string): Promise<{ message: string }> {
  const res = await apiRequest("/auth/password-reset/request", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Nie udało się zlecić resetowania hasła.");
  }
  return res.json();
}

export async function confirmPasswordReset(token: string, new_password: string): Promise<{ message: string }> {
  const res = await apiRequest("/auth/password-reset/reset", {
    method: "POST",
    body: JSON.stringify({ token, new_password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Nie udało się zresetować hasła.");
  }
  return res.json();
}
