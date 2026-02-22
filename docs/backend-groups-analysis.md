# Analiza: Grupy pytań na stronie Test Details – co zrobić na backendzie

## 1. Stan obecny

### Frontend (Test Detail Page)

- **Grupy są tylko w stanie lokalnym** (React state):
  - `groups: GroupTabItem[]` – lista grup z `id` (string, np. `"default"`, `"group-0"`) i `label` (np. "Grupa A")
  - `activeGroupId` – która grupa jest wybrana
  - `groupQuestionIds: Record<string, number[]>` – które pytania (po ID) należą do której grupy

- **Dostępne akcje w UI** (bez zapisu na backendzie):
  - Dodanie pustej grupy
  - Duplikowanie bieżącej grupy (kopia grupy z pytaniami)
  - Zmiana nazwy grupy (menu przy zakładce)
  - Usunięcie grupy (menu przy zakładce)
  - „Generuj wariant AI” (obecnie tylko `alert`, placeholder)

- **Skutek:** Po odświeżeniu strony wszystkie grupy znikają – zostaje jedna domyślna „Grupa A” z wszystkimi pytaniami. Żadna zmiana grup nie jest trwała.

### Backend

- **Baza danych:**
  - `Test`: `id`, `owner_id`, `title`, `created_at` – brak pojęcia „grupa”
  - `Question`: `id`, `test_id`, `position`, `text`, `is_closed`, `difficulty`, `choices`, `correct_choices`, `citations` – brak powiązania z grupą

- **API:**
  - `GET /tests/{test_id}` zwraca `TestDetailOut`: `test_id`, `title`, `questions` (płaska lista) – brak grup
  - Brak endpointów: tworzenie/edycja/usuwanie grup, przypisywanie pytań do grup

- **Serwis:** `TestService.get_test_detail`, `add_question`, `reorder_questions` itd. działają na płaskiej liście pytań w ramach testu. Kolejność jest globalna (`position` w obrębie testu), nie per grupa.

---

## 2. Cel

- Grupy mają być **trwałe** – zapisane w bazie i powiązane z testem.
- Operacje z UI (dodaj/zmień nazwę/usuń grupę, duplikuj grupę, przenoszenie pytań między grupami) mają **modyfikować dany test** przez API i być odzwierciedlone po odświeżeniu.
- Export (PDF/XML) może w przyszłości uwzględniać grupy (np. nagłówki sekcji), ale na start wystarczy, żeby backend przechowywał i zwracał grupy oraz przypisania pytań do grup.

---

## 3. Proponowane zmiany na backendzie

### 3.1. Model danych (baza)

**Opcja A (rekomendowana): osobna tabela grup**

- **Nowa tabela `question_group`:**
  - `id` (PK)
  - `test_id` (FK → `test.id`, CASCADE)
  - `label` (np. varchar 200) – nazwa grupy („Grupa A”, „Część 1”)
  - `position` (int, default 0) – kolejność grup w obrębie testu

- **Tabela `question`:**
  - Dodać kolumnę `group_id` (FK → `question_group.id`, nullable lub NOT NULL po migracji).
  - Dla istniejących testów: w migracji utworzyć jedną grupę „Grupa A” per test i ustawić `question.group_id` dla wszystkich pytań tego testu.

**Opcja B (grupy jako JSON na teście)**  
Mniej elastyczna (trudniejsze zapytania, brak FK), nie rekomendowana.

**Rekomendacja:** Opcja A – czytelny model, łatwe zapytania, spójność referencyjna.

### 3.2. Schematy API (Pydantic)

- **GroupOut** (lub w schematach jako `TestGroupOut`):
  - `id: int`
  - `label: str`
  - `position: int` (opcjonalnie, jeśli kolejność grup ma być zwracowana/ustawiana)

- **TestDetailOut** – rozszerzenie:
  - `groups: list[GroupOut]` – lista grup testu (posortowana np. po `position`)
  - W **QuestionOut** dodać `group_id: int | None` – do której grupy należy pytanie (frontend może z tego zbudować `groupQuestionIds`).

- **Requesty:**
  - **GroupCreate** (body do tworzenia grupy): `label: str`, opcjonalnie `position: int`
  - **GroupUpdate** (body do PATCH grupy): `label: str | None`, `position: int | None` (tylko ustawione pola)
  - **AssignQuestionsToGroup** (opcjonalnie osobny endpoint lub część PATCH questions): `question_ids: list[int]`, `group_id: int` – przypisanie pytań do grupy

### 3.3. Endpointy

| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/tests/{test_id}` | Nie zmieniać ścieżki; **rozszerzyć odpowiedź** o `groups` oraz `group_id` w każdym pytaniu. |
| POST | `/tests/{test_id}/groups` | Tworzenie nowej grupy (body: label, opcjonalnie position). Zwraca `GroupOut`. |
| PATCH | `/tests/{test_id}/groups/{group_id}` | Aktualizacja grupy (zmiana nazwy, ewentualnie pozycji). |
| DELETE | `/tests/{test_id}/groups/{group_id}` | Usunięcie grupy **oraz wszystkich pytań należących do tej grupy**. Pytania nie są przenoszone – są usuwane. |
| PATCH lub PUT | `/tests/{test_id}/questions/assign-group` | Przypisanie pytań do grupy: body `{ "question_ids": [...], "group_id": 123 }`. |

- **Duplikowanie grupy:**  
  Można dodać **POST `/tests/{test_id}/groups/{group_id}/duplicate`**, który w backendzie: tworzy nową grupę z taką samą etykietą (+ „ (kopia)”), kopiuje wszystkie pytania z grupy źródłowej (nowe rekordy `Question` z tym samym tekstem/opcjami itd.) i przypisuje je do nowej grupy. Zwraca np. nową grupę i listę nowych pytań.

- **Dodawanie pytania (POST `/tests/{test_id}/questions`):**  
  Pytanie jest **zawsze dodawane w obrębie konkretnej grupy** – front wie, w której grupie użytkownik się znajduje (aktywna zakładka). W **QuestionCreate** dodać pole **`group_id: int`** (wymagane). Front przy wywołaniu add_question przekazuje `group_id` aktywnej grupy, backend zapisuje nowe pytanie z tym `group_id`. Ewentualnie fallback: jeśli brak `group_id` (stare klienty), ustawić pierwszą grupę testu.

### 3.4. Logika biznesowa (TestService / repozytorium)

- **get_test_detail:**  
  Pobiera test z pytaniami **i** listę grup tego testu (z tabeli `question_group`). Mapuje do `TestDetailOut` z `groups` oraz uzupełnia `group_id` w każdym `QuestionOut`.

- **Tworzenie pustego testu (create_empty_test):**  
  Po utworzeniu rekordu `Test` utworzyć jedną domyślną grupę (np. „Grupa A”, position=0) dla tego testu, żeby nowe pytania miały gdzie trafić.

- **Generowanie testu z AI (generate_test_from_input):**  
  Po utworzeniu testu utworzyć jedną grupę domyślną i przypisać do niej wszystkie wygenerowane pytania (ustawić `group_id` przy zapisie pytań).

- **add_question:**  
  Front dodaje pytanie **w obrębie aktualnie wybranej grupy** i wysyła jej `group_id`. Backend ustawia w rekordzie `Question` ten `group_id`. Pole `group_id` w requestcie wymagane (albo opcjonalne z fallbackiem na pierwszą grupę testu dla kompatybilności wstecznej).

- **reorder_questions:**  
  Obecnie: jedna płaska lista `question_ids` dla całego testu. Do ustalenia z frontendem:
  - **Wariant 1:** Kolejność globalna nadal – front po stronie grup wysyła np. question_ids w kolejności: najpierw wszystkie z grupy 1, potem z grupy 2 itd. Backend tylko ustawia `position` po tej liście.
  - **Wariant 2:** Osobne reorderowanie w obrębie grupy – endpoint np. `PUT /tests/{test_id}/groups/{group_id}/questions/reorder` z `question_ids` – wtedy `position` może być globalne albo „per grupa” (wymagałoby to zmiany znaczenia `position` lub dodatkowego pola). Na start wystarczy wariant 1.

- **Usunięcie grupy:**  
  **Usunąć wszystkie pytania należące do tej grupy**, a następnie usunąć rekord `question_group`. Pytania nie są przenoszone do innej grupy – usunięcie grupy = usunięcie jej pytań.

- **Duplikowanie grupy:**  
  Jak wyżej: nowa grupa + kopie wszystkich pytań z grupy źródłowej (nowe wiersze w `question` z `group_id` = nowa grupa).

### 3.5. Migracja bazy

1. Utworzenie tabeli `question_group` (id, test_id, label, position).
2. Dodanie kolumny `group_id` w `question` (nullable, FK do `question_group.id`).
3. Skrypt migracji danych:
   - Dla każdego testu: wstawić jeden wiersz w `question_group` (np. label „Grupa A”, position 0).
   - Zaktualizować wszystkie pytania tego testu: `group_id` = id tej grupy.
4. (Opcjonalnie) Ustawienie `group_id` na NOT NULL w `question` po zakończeniu backfillu.

### 3.6. Warstwa domeny / repozytorium

- **Domain:** Dodać model domenowy np. `QuestionGroup` (id, test_id, label, position) i ewentualnie rozszerzyć `Test` o listę grup (lub ładować grupy obok testu).
- **Question (domena):** Dodać pole `group_id: int | None`.
- **TestRepository (lub nowe GroupRepository):** Metody typu: `get_groups_for_test(test_id)`, `create_group(test_id, label, position)`, `update_group(group_id, ...)`, `delete_group(group_id)`, `assign_questions_to_group(question_ids, group_id)`.
- W **add_question** w repozytorium: ustawiać `group_id` w tworzonym rekordzie `Question` na podstawie requestu – front zawsze przekazuje grupę, w której użytkownik dodaje pytanie.

---

## 4. Kolejność wdrożenia (propozycja)

1. Migracja DB: tabela `question_group`, kolumna `question.group_id`, backfill.
2. Modele domenowe i mapowanie do schematów API (GroupOut, rozszerzenie TestDetailOut i QuestionOut).
3. Repozytorium grup (CRUD) + rozszerzenie `get_test_detail` i tworzenia testu (domyślna grupa).
4. Endpointy: POST/PATCH/DELETE grup, ewentualnie PATCH assign-group.
5. Rozszerzenie `add_question` o wymagane `group_id` z requestu (front wysyła grupę, w której użytkownik dodaje pytanie).
6. Endpoint duplikowania grupy (POST duplicate).
7. Na frontendzie: ładowanie grup i `group_id` z API, zastąpienie lokalnego stanu wywołaniami API przy dodawaniu/edycji/usuwaniu grup i przypisywaniu pytań – wtedy zmiany będą trwałe i będą edytować dany test.

---

## 5. Podsumowanie

- **Problem:** Frontend pokazuje grupy i pozwala je dodawać/edytować/usuwać/duplikować, ale backend nie przechowuje grup ani przypisań pytań do grup, więc nic z tego nie jest zapisywane.
- **Rozwiązanie:** Wprowadzić na backendzie encję „grupa pytań” (tabela `question_group`), powiązanie pytanie–grupa (`question.group_id`), rozszerzyć GET testu o grupy i `group_id` w pytaniach oraz dodać endpointy do CRUD grup, przypisywania pytań do grup i duplikowania grupy. Po podpięciu frontendu pod te endpointy funkcje staną się trwałe i będą poprawnie edytować dany test.
