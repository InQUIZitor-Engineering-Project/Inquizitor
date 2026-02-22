# Plan implementacji: drag & drop kolejności pytań (test details → PDF)

## Cel
Użytkownik na stronie szczegółów testu może zmieniać kolejność pytań przez przeciąganie (drag and drop). Zapisana kolejność jest używana w eksporcie PDF (single-variant i jako baza dla wariantów, jeśli potrzebne).

---

## 1. Backend

### 1.1 Model i baza
- **Tabela `question`:** dodać kolumnę `position: int`, domyślnie `0`, NOT NULL.
- **Migracja Alembic:**
  - `add_column('question', 'position', sa.Integer(), nullable=False, server_default='0')`
  - Backfill: dla każdego testu ustawić `position = index` według aktualnej kolejności po `id` (np. jedna aktualizacja per test: `UPDATE question SET position = ord.idx FROM (SELECT id, row_number() OVER (ORDER BY id) - 1 AS idx FROM question WHERE test_id = :tid) ord WHERE question.id = ord.id`).
- **Model SQLModel** (`app/db/models.py`): w `Question` dodać pole `position: int = Field(default=0)`. W relacji `Test.questions` zmienić `order_by` z `"Question.id"` na `"Question.position, Question.id"`.

### 1.2 Zwracanie kolejności
- **get_test_detail:** przestać nadpisywać kolejność przez `_sort_questions`. Pytania są już w dobrej kolejności z repozytorium (position, id). Usunąć linię `test.questions = self._sort_questions(test.questions)` (lub zastąpić sortowaniem po position, jeśli repozytorium nie sortuje – wtedy w repo przy `get_with_questions` upewnić się, że zwracane pytania są posortowane po `position`, potem `id`).
- **Repozytorium:** jeśli relacja SQLModel `order_by` nie wystarczy (bo ładuje się lazy), w `get_with_questions` po załadowaniu testu posortować `db_test.questions` po `position`, `id` przed mapowaniem do domeny.

### 1.3 Endpoint reorder
- **Ścieżka:** `PUT` lub `PATCH` `/api/tests/{test_id}/questions/reorder`.
- **Body:** `{ "question_ids": [3, 1, 2] }` – lista id pytań w docelowej kolejności.
- **Logika:**
  - Sprawdzenie, że test istnieje i należy do `current_user`.
  - Walidacja: `question_ids` to dokładnie te same pytania, które należą do tego testu (bez duplikatów, bez obcych id).
  - W jednej transakcji: dla każdego `(question_id, index)` ustawić `position = index`. Commit.
- **Schemat:** nowy request model np. `ReorderQuestionsRequest(question_ids: list[int])` w `app/api/schemas/tests/`.
- **Router:** endpoint w `app/api/routers/tests.py`, wywołanie nowej metody w `TestService`.

### 1.4 Serwis
- **TestService:** metoda `reorder_questions(owner_id, test_id, question_ids: list[int])`:
  - Pobranie testu (z pytaniami), sprawdzenie własności.
  - Sprawdzenie, że zbiór `question_ids` == zbiór id pytań testu.
  - Dla każdego pytania ustawienie `position = index` w `question_ids`.
  - Zapisy przez repozytorium/session.

### 1.5 Eksport PDF
- **Obecnie:** `_prepare_pdf_context` bierze `detail.questions` i wywołuje `_sort_questions(questions)` (trudność → id).
- **Zmiana:** Nie sortować po trudności. Używać kolejności z `detail.questions` tak jak przyszła z API (już w kolejności position). Czyli w `_prepare_pdf_context` usunąć wywołanie `_sort_questions` dla głównej listy; `questions = [self._build_question_payload(q) for q in detail.questions]` pozostaje w tej samej kolejności.
- **Warianty A/B:** jeśli `generate_variants` jest True, można zostawić obecne tasowanie wewnątrz trudności na bazie tej listy, albo tasować wewnątrz obecnej kolejności – do decyzji (na start: lista do wariantów w tej samej kolejności użytkownika, ewentualne shuffle tylko opcjonalnie).

### 1.6 Cache PDF
- Cache key już zawiera hash pytań. Po dodaniu `position` kolejność jest częścią danych, więc hash się zmieni przy zmianie kolejności – cache będzie unieważniany poprawnie (o ile hash budowany jest z pełnej listy w ustalonej kolejności).

---

## 2. Frontend

### 2.1 Zależności
- Dodać **@dnd-kit/core** i **@dnd-kit/sortable** (oraz opcjonalnie **@dnd-kit/utilities**). To obecny standard dla list sortable; brak w projekcie biblioteki do sortowania list.

### 2.2 API
- W `frontend/src/services/test.ts`:
  - Dodać funkcję `reorderQuestions(testId: number, questionIds: number[]): Promise<void>` wywołującą `PUT` (lub `PATCH`) `/tests/{testId}/questions/reorder` z body `{ question_ids: questionIds }`.
  - Typy: np. `ReorderQuestionsPayload { question_ids: number[] }`.

### 2.3 Dane i kolejność
- **useTestData:** przestać sortować pytania po trudności. Używać kolejności z API: `questions: detail.questions` bez `sortQuestions(detail.questions)`. Usunąć eksport/użycie `sortQuestions` w kontekście listy pytań testu (można zostawić helper gdzie indziej, jeśli używany).
- Po udanym reorderze: albo `refresh()` z API, albo aktualizacja lokalna `setData(prev => ({ ...prev, questions: newOrder }))` (optimistic update).

### 2.4 Komponenty – ogólny flow
- **QuestionsSection:** renderuje listę pytań we właściwej kolejności. Lista musi być opakowana w:
  - `DndContext` (@dnd-kit/core) – obsługa drag end, sensors (pointer, touch, keyboard).
  - `SortableContext` (@dnd-kit/sortable) – strategy `verticalListSortingStrategy`, items = lista id pytań (lub indeksów).
- Każdy element listy (karta pytania w trybie view oraz karta w trybie edycji) powinien być w **Sortable** wrapperze (użycie `useSortable`), żeby miał `attributes`, `listeners`, `setNodeRef`, `transform`, `transition` – i przekazać drag handle tylko do uchwytu.

### 2.5 Drag handle
- **QuestionView:** po lewej stronie, przed checkboxem i `IndexChip`, dodać uchwyt (ikona „6 kropek” lub ≡). Uchwyt:
  - Ma `ref` i `listeners` z `useSortable` (albo przekazane z rodzica), żeby tylko za niego rozpoczynać przeciąganie.
  - Styl: cursor grab/grabbing, delikatny hover (np. kolor tła), aria-label np. „Zmień kolejność”.
- **QuestionCard / Index:** `index` w kartach to pozycja w liście (0-based), wyświetlana jako `index + 1`. Po reorderze indeksy się nie zmieniają (bo lista się przestawia).

### 2.6 Gdzie umieścić Sortable
- **Opcja A:** Jeden wspólny wrapper w `QuestionsSection`: każdy element w pętli to `<SortableQuestion key={q.id} id={q.id} index={idx} ...>`. Wewnątrz `SortableQuestion` renderujemy albo `QuestionView`, albo `QuestionCard` + `QuestionEditor`, w zależności od `isEditing`. `useSortable({ id: q.id })` w tym wrapperze.
- **Opcja B:** Tylko `QuestionView` jest sortable; karta edycji i karta „dodaj pytanie” nie biorą udziału w DnD (są na stałe na końcu lub w miejscu edytowanego pytania). Wtedy w `QuestionsSection` dla każdego `q` nie w trybie edycji renderujemy `<SortableQuestionView ... />`, a dla edycji zwykły blok bez sortable.

Rekomendacja: **Opcja A** – każdy wiersz (pytanie lub edycja) jest jednym elementem listy sortable; podczas edycji tego konkretnego wiersza można zablokować drag (disabled), żeby nie przesuwać w trakcie edycji.

### 2.7 Obsługa drag end
- W `QuestionsSection` (lub w hooku przekazanym z góry) w `DndContext`:
  - `onDragEnd={(event) => { ... }}`
  - Z `event`: `active.id`, `over.id`. Z listy `questions` zbudować nową kolejność (przesunięcie `active` na pozycję `over`). Wywołać `reorderQuestions(testId, newOrderIds)` i potem `refresh()` albo optimistic `setData`.
- Identyfikatory w `SortableContext`: używać `q.id` (number), bo są unikalne. Dnd-kit przyjmuje string | number; spójnie używać id pytań.

### 2.8 Stylowanie podczas drag
- Dla aktywnego (przeciąganego) elementu: zastosować `transform` i `transition` z `useSortable`, ewentualnie `opacity`, `zIndex`, `cursor: grabbing`.
- Dla „over” (nad którym jest przeciągany): opcjonalnie wizualny placeholder (np. wyższy border, pasek) – `SortableContext` + `useSortable` zwykle dają to przez `over`; można użyć komponentu z @dnd-kit/sortable do automatycznego wizualnego feedbacku.

### 2.9 Hook / state
- **useTestDetail:** dodać akcję `handleReorderQuestions(questionIds: number[])`: wywołanie `reorderQuestions(testId, questionIds)`, potem `refresh()` (lub optimistic update + rollback przy błędzie). Przekazać tę akcję do `QuestionsSection` w `actions`.

### 2.10 Edge cases
- **Pusta lista / jedno pytanie:** DnD nie musi być włączone (SortableContext z jednym elementem – można zostawić, nie będzie efektu).
- **Błąd API reorder:** Pokazać błąd (toast / stan), przy optimistic update cofnąć kolejność do poprzedniej.
- **Edycja w toku:** Podczas gdy jedno pytanie jest w trybie edycji, można zablokować drag dla tego elementu (`disabled: true` w `useSortable`) albo dla całego kontekstu – prościej zablokować tylko ten jeden element.

---

## 3. Kolejność prac (sugerowana)

1. **Backend: migracja + model** – kolumna `position`, backfill, zmiana `order_by`.
2. **Backend: reorder endpoint + serwis** – walidacja, zapis pozycji.
3. **Backend: get_test_detail** – usunięcie sortowania po trudności, zwracanie w kolejności position.
4. **Backend: PDF** – w `_prepare_pdf_context` nie wywoływać `_sort_questions`; kolejność z `detail.questions`.
5. **Frontend: API** – `reorderQuestions`, typy.
6. **Frontend: useTestData** – brak sortowania po trudności; użycie kolejności z API.
7. **Frontend: zależności** – @dnd-kit/core, @dnd-kit/sortable.
8. **Frontend: QuestionsSection + Sortable** – DndContext, SortableContext, opakowanie każdego wiersza w Sortable, drag handle w QuestionView (lub w wrapperze).
9. **Frontend: onDragEnd** – obliczenie nowej kolejności, wywołanie `reorderQuestions`, refresh/optimistic.
10. **Testy ręczne / e2e** – zmiana kolejności, odświeżenie strony, eksport PDF – w PDF ta sama kolejność co na stronie.

---

## 4. Pliki do utworzenia / zmiany (skrót)

| Obszar | Plik | Zmiany |
|--------|------|--------|
| Backend | `migrations/versions/xxx_add_question_position.py` | Nowa migracja: add column, backfill |
| Backend | `app/db/models.py` | `Question.position`, `order_by` w relacji |
| Backend | `app/api/schemas/tests/__init__.py` | `ReorderQuestionsRequest` |
| Backend | `app/api/routers/tests.py` | Endpoint reorder |
| Backend | `app/application/services/test_service.py` | `reorder_questions`, get_test_detail bez _sort_questions, _prepare_pdf_context bez _sort_questions |
| Backend | Repo (jeśli potrzeba) | Ewentualne jawne sortowanie w `get_with_questions` |
| Frontend | `package.json` | @dnd-kit/core, @dnd-kit/sortable |
| Frontend | `src/services/test.ts` | `reorderQuestions`, typ |
| Frontend | `src/pages/TestDetailPage/hooks/useTestData.ts` | Usunąć sortQuestions z ładowania listy |
| Frontend | `src/pages/TestDetailPage/hooks/useTestDetail.ts` | Akcja `handleReorderQuestions`, przekazanie do sekcji |
| Frontend | `src/pages/TestDetailPage/components/QuestionsSection.tsx` | DndContext, SortableContext, Sortable wrapper, onDragEnd |
| Frontend | `src/pages/TestDetailPage/components/QuestionView.tsx` | Drag handle (ikona + listeners/ref) |

Po realizacji tego planu kolejność pytań ustawiana drag & drop na stronie testu będzie zapisywana i odwzorowana w eksporcie PDF.
