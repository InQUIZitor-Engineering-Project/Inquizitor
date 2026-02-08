# Plan działania: Logowanie i rejestracja przez Google (OAuth 2.0)

Plan oparty na istniejącej implementacji auth w aplikacji (FastAPI + React, JWT + refresh token, weryfikacja e-mail przy rejestracji).

---

## 1. Obecny stan (podsumowanie)

| Warstwa | Pliki / elementy |
|--------|-------------------|
| **Backend – auth** | `app/api/routers/auth.py` (POST `/register`, `/login`, `/refresh`, `/verify-email`, password reset), `app/application/services/auth_service.py`, `app/core/security.py` (JWT, OAuth2PasswordBearer) |
| **Backend – użytkownik** | `app/db/models.py` – `User(hashed_password: str` wymagane), `app/domain/models/user.py` – to samo |
| **Backend – konfiguracja** | `app/core/config.py` – brak zmiennych Google OAuth |
| **Frontend – auth** | `frontend/src/services/auth.ts` (login, register, verifyEmail), `context/AuthContext.tsx` (login, loginWithToken, logout) |
| **Frontend – UI** | `LoginPage.tsx`, `RegisterPage.tsx` – formularze email/hasło, brak przycisku Google |

Uwaga: `google-auth` jest już w `requirements.txt` (Gemini); do pełnego flow OAuth (redirect → code → token → userinfo) przyda się `authlib` lub użycie `httpx` + `google-auth`.

---

## 2. Backend

### 2.1 Konfiguracja

- **Plik:** `backend/app/core/config.py`
- Dodać zmienne (z `.env`):
  - `GOOGLE_CLIENT_ID: str | None = None`
  - `GOOGLE_CLIENT_SECRET: str | None = None`
- Opcjonalnie: `GOOGLE_REDIRECT_PATH: str = "/auth/google/callback"` (pełny redirect_uri = `FRONTEND_BASE_URL` lub `BACKEND_URL` + ten path – zależnie od tego, czy callback jest w backendzie, patrz niżej).

### 2.2 Baza danych i modele

- **Opcja A (zalecana na start):** Nie zmieniać struktury użytkownika. Dla użytkowników „tylko Google” zapisywać w `hashed_password` **placeholder nie do odgadnięcia** (np. `bcrypt.hash(secrets.token_urlsafe(32))`), żeby logowanie hasłem było niemożliwe. Nie wymaga migracji.
- **Opcja B:** Dodać pole `auth_provider: str | None` (np. `"email"` | `"google"`) i ewentualnie w dalszej kolejności `hashed_password: str | None`. Wymaga migracji Alembic i aktualizacji wszystkich miejsc używających `hashed_password` (np. zmiana hasła w `user_service` – tylko dla `auth_provider == "email"`).

Rekomendacja: zacząć od **Opcji A**; jeśli później chcesz „Zmień hasło” tylko dla użytkowników email, wtedy dodać `auth_provider` i migrację.

### 2.3 Endpointy OAuth (backend obsługuje callback)

- **GET `/auth/google/authorize`**
  - Przekierowanie (302) do Google Authorization URL z:
    - `client_id`, `redirect_uri` (np. `{BACKEND_URL}/auth/google/callback`),
    - `response_type=code`, `scope=openid email profile`,
    - `state` (np. `secrets.token_urlsafe(16)`) – zapisać w sesji/cookie lub przekazać w `state` i zweryfikować w callback.
  - Frontend tylko linkuje do tego URL (np. „Zaloguj przez Google”).

- **GET `/auth/google/callback`**
  - Parametry: `code`, `state`.
  - Zweryfikować `state`.
  - Wymiana `code` na tokeny (access_token + id_token) przez Google Token Endpoint.
  - Opcjonalnie: zweryfikować `id_token` (JWT) przez `google-auth`.
  - Pobranie danych użytkownika (email, imię, nazwisko) z UserInfo API lub z claims w `id_token`.
  - Wywołanie serwisu auth (patrz 2.4): „znajdź lub utwórz użytkownika” i wystawienie JWT + refresh (tak jak dziś `issue_token`).
  - Odpowiedź: **przekierowanie 302 na frontend** z tokenami, np.:
    - `{FRONTEND_BASE_URL}/auth/callback?access_token=...&refresh_token=...&token_type=bearer`
    - Frontend na `/auth/callback` odczyta parametry, zapisze tokeny (np. przez `loginWithToken`) i przekieruje na `/dashboard`.

### 2.4 Serwis auth (AuthService)

- **Nowa metoda**, np. `get_or_create_user_from_google(*, email: str, first_name: str | None, last_name: str | None) -> User`:
  - Szuka użytkownika po `email` (np. `uow.users.get_by_email(email)`).
  - Jeśli jest: zwraca użytkownika (można później dodać aktualizację imienia/nazwiska z Google).
  - Jeśli nie ma: tworzy użytkownika z:
    - `email`, `first_name`, `last_name` z Google,
    - `hashed_password` = placeholder (Opcja A) lub `None` (Opcja B po migracji).
  - Bez wysyłania e-maila weryfikacyjnego (Google już zweryfikował adres).
- W **callbacku** (w routerze): po pobraniu danych z Google wywołać `get_or_create_user_from_google`, potem `auth_service.issue_token(user)` i przekierować na frontend z tokenami.

### 2.5 Zabezpieczenia

- Zawsze sprawdzać `state` w callback (ochrona przed CSRF).
- `redirect_uri` w żądaniu do Google musi dokładnie zgadzać się z zarejestrowanym w Google Cloud Console (w tym ścieżka i port przy localhost).
- Nie logować ani nie przekazywać dalej `GOOGLE_CLIENT_SECRET`; tylko server-side wymiana `code` na tokeny.

### 2.6 Zależności

- Obecne: `google-auth`, `httpx`. Do wykonania requestów do Google Token/UserInfo można użyć `httpx` + ręcznie złożony OAuth2 flow lub dodać **authlib** (np. `authlib[httpx]`) dla wygody. W planie można założyć: albo `authlib`, albo ręczna implementacja z `google-auth` + `httpx`.

---

## 3. Frontend

### 3.1 Strona callbacku po logowaniu Google

- **Nowa trasa**, np. `/auth/callback` (lub `/login/callback`).
- Komponent strony:
  - Odczyt z query: `access_token`, `refresh_token` (i ewent. `token_type`).
  - Wywołanie `loginWithToken(accessToken, refreshToken)` z `AuthContext`.
  - Przekierowanie na `/dashboard` (np. `navigate('/dashboard')`).
  - Obsługa błędu (brak tokenów / nieprawidłowe): przekierowanie na `/login` z komunikatem (np. przez `location.state` lub query).

### 3.2 Login – przycisk Google

- **Plik:** `frontend/src/pages/LoginPage/LoginPage.tsx`
- Dodać przycisk typu „Zaloguj przez Google”, który:
  - Otwiera w tym samym oknie (lub w nowym, zależnie od UX): `window.location.href = `${API_BASE}/auth/google/authorize`` (gdzie `API_BASE` to `import.meta.env.VITE_API_URL`). Backend zwróci 302 na Google, użytkownik wraca na backend callback, a ten przekierowuje na frontend `/auth/callback` z tokenami.
- Umieścić przycisk pod formularzem (np. „lub”) lub nad, spójnie z Register.

### 3.3 Rejestracja – przycisk Google

- **Plik:** `frontend/src/pages/RegisterPage/RegisterPage.tsx`
- Ten sam cel URL: `GET /auth/google/authorize`. Dla Google nie ma rozróżnienia „rejestracja vs logowanie” po stronie backendu – jeden flow: „znajdź lub utwórz” (patrz 2.4). Przycisk typu „Zarejestruj się przez Google” z linkiem na ten sam endpoint.
- Tekst: np. „Zarejestruj się przez Google” lub „Kontynuuj z Google”.

### 3.4 AuthContext

- **Brak zmian wymaganych:** `loginWithToken(accessToken, refreshToken)` już zapisuje tokeny i ładuje użytkownika – strona `/auth/callback` z tego skorzysta.

### 3.5 Opcjonalnie

- W `auth.ts` można dodać funkcję `getGoogleAuthorizeUrl(): string` zwracającą `${API_BASE}/auth/google/authorize` i używać jej w Login/Register dla spójności i ewentualnych query params (np. `state` z frontendu).

---

## 4. Google Cloud Console

- W projekcie Google Cloud: **APIs & Services → Credentials**.
- Utworzyć **OAuth 2.0 Client ID** (typ „Aplikacja internetowa”).
- **Authorized redirect URIs:** dodać dokładny URL callbacku backendu, np.:
  - dev: `http://localhost:8000/auth/google/callback` (lub port, na którym stoi backend),
  - prod: `https://api.inquizitor.pl/auth/google/callback` (jeśli backend pod taką domeną).
- Skopiować **Client ID** i **Client Secret** do `.env` (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET).

---

## 5. Kolejność realizacji (checklist)

1. **Konfiguracja**
   - [ ] Dodać `GOOGLE_CLIENT_ID` i `GOOGLE_CLIENT_SECRET` do `Settings` w `config.py` oraz do `.env` / dokumentacji.

2. **Backend – serwis**
   - [ ] Zaimplementować `get_or_create_user_from_google` w `AuthService` (placeholder hasła dla nowych użytkowników).
   - [ ] (Opcjonalnie) Dodać zależność `authlib` lub zaimplementować wymianę kodu na tokeny + UserInfo przy użyciu `httpx` + `google-auth`.

3. **Backend – router**
   - [ ] Endpoint `GET /auth/google/authorize` (generowanie URL, ustawienie `state`, redirect do Google).
   - [ ] Endpoint `GET /auth/google/callback` (weryfikacja `state`, wymiana `code` → tokeny, userinfo, get_or_create_user, issue_token, redirect na frontend z tokenami).

4. **Frontend – callback**
   - [ ] Trasa `/auth/callback` i komponent odczytujący tokeny z query i wywołujący `loginWithToken`, potem redirect na `/dashboard`.

5. **Frontend – UI**
   - [ ] Przycisk „Zaloguj przez Google” na `LoginPage` (link do `/auth/google/authorize`).
   - [ ] Przycisk „Zarejestruj się przez Google” / „Kontynuuj z Google” na `RegisterPage`.

6. **Google Cloud**
   - [ ] Skonfigurować OAuth client i redirect URI.
   - [ ] Przetestować flow w dev i prod.

7. **Dokumentacja / edge case’y**
   - [ ] Co jeśli użytkownik wcześniej zarejestrował się emailem z tym samym adresem co Google? Decyzja: albo automatyczne „linkowanie” (logowanie przez Google uznajemy za ten sam użytkownik), albo komunikat „Ten email jest już zarejestrowany. Zaloguj się hasłem.” Obecny plan zakłada pierwsze (jeden użytkownik = jeden email).
   - [ ] Jeśli wybierzesz później pole `auth_provider`: blokada „Zmień hasło” dla użytkowników tylko-Google i ewentualna możliwość „Ustaw hasło” (dodanie hasła do konta Google).

---

## 6. Podsumowanie plików do zmiany / dodania

| Działanie | Plik |
|-----------|------|
| Konfiguracja Google | `backend/app/core/config.py` |
| Serwis Google auth | `backend/app/application/services/auth_service.py` |
| Endpointy OAuth | `backend/app/api/routers/auth.py` (lub nowy plik `auth_google.py` i dołączenie do routera) |
| Callback + przyciski | `frontend/src/App.tsx` (trasa), nowa strona `AuthCallbackPage`, `LoginPage.tsx`, `RegisterPage.tsx` |
| Opcjonalnie | `frontend/src/services/auth.ts` – helper URL Google |

Po realizacji tego planu użytkownicy będą mogli logować się i rejestrować jednym przyciskiem przez konto Google, a backend będzie wystawiał te same JWT/refresh tokeny co przy logowaniu hasłem, więc reszta aplikacji (AuthContext, chronione trasy, API) pozostaje bez zmian.
