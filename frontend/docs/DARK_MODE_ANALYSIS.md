# Analiza ciemnego trybu i rekomendacje na poziom enterprise

## 0. Zaimplementowane kroki

### Krok 1 (Kroki 1–4 z analizy)
- **Struktura motywów**: `src/styles/theme/` – `constants.ts`, `types.ts`, `light.ts`, `dark.ts`, `eyeFriendly.ts`, `index.ts` (getTheme, applyTypography). Pełna paleta dark (w tym shadows i elevation).
- **Synchronizacja z CSS**: komponent `ThemeSync` ustawia na `:root` zmienne `--surface-page`, `--color-neutral-white`, `--color-danger-main`. W `App.css` tło body: `var(--surface-page, #f5f7fa)`.
- **PersonalizationContext**: używa wyłącznie `getTheme(colorTheme)` i `applyTypography(theme, fontSize)` – bez inline nadpisywania kolorów.
- **Navbar (avatar)**: tło i hover z `theme.colors.neutral.white` / `theme.colors.neutral.silver`, cienie z `theme.shadows`.
- **Kompatybilność wsteczna**: `src/styles/theme.ts` re-eksportuje domyślny motyw i getTheme/applyTypography.

### Krok 2 – Design system (Krok 5 z analizy, część)
Usunięto hardcoded kolory w komponentach design systemu; używają wyłącznie theme:
- **Modal.tsx**: `ModalContainer` → `theme.colors.neutral.white`; `SelectableItem` → theme (border, background, hover).
- **Tooltip.tsx**: tło, kolor tekstu, obramowanie, cień, strzałka → `theme.colors.neutral.*`, `theme.elevation.lg`.
- **Button.ts**: primary/info → `theme.tone.inverted`; ghost/outline/success → `theme.colors.tint.t5`, `theme.colors.neutral.*`, `theme.colors.brand.primary`; danger już z theme.
- **Input.ts, Select.ts, Textarea.ts**: tło `theme.colors.neutral.white`, focus `theme.colors.brand.info` + `theme.colors.tint.t5`, disabled `theme.colors.neutral.silver`.
- **CloseButton.tsx**: hover → `theme.colors.neutral.silver`.
- **Divider.ts**: linia → `theme.colors.neutral.greyBlue`.
- **AlertBar.tsx**: warianty info/success/warning/danger → `theme.colors.brand.info`, `theme.colors.action.*`, `theme.colors.danger.*`, `theme.colors.tint.t5`, `theme.colors.neutral.*`.
- **CustomSelect.tsx**: focus ring → `theme.colors.tint.t5`.
- **Sidebar**: tekst „Brak wyników” → `theme.colors.neutral.grey`; DeleteIcon hover → `theme.colors.tint.t5` (usunięto fallback `#ffebee`).

### Krok 3 – Strony: TestDetail, Settings, Profile, QuestionCard (Krok 5 cd.)
- **GroupTabs.tsx**: Tab hover → `theme.colors.neutral.silver`; TabMenuTrigger hover → `theme.colors.neutral.silver`; AddMenuDivider → `theme.colors.neutral.greyBlue`; AddMenuItem (kolor, hover) → `theme.colors.neutral.dGrey`, `theme.colors.neutral.silver`; AddMenuItemFeatured / AddMenuItemIcon → `theme.colors.brand.info`, `theme.colors.tint.t5`.
- **QuestionsSection.tsx**: DragHandle (kolor, hover tło/kolor) → `theme.colors.neutral.grey`, `theme.colors.neutral.silver`, `theme.colors.neutral.dGrey`; lista odpowiedzi (poprawna) → `theme.colors.tint.t5`.
- **QuestionView.tsx**: ToolbarButton (kolor, hover, focus) → `theme.colors.neutral.grey`, `theme.colors.tint.t5` / `theme.colors.danger.*`, `theme.colors.brand.primary`; ToolbarDivider → `theme.colors.neutral.greyBlue`; zaznaczona karta i badge „Otwarte” → `theme.colors.brand.primary`, `theme.colors.tint.t5` (useTheme).
- **BulkActionBar.tsx**: FloatingContainer (tło, cień, obramowanie) → `theme.colors.neutral.white`, `theme.elevation["2xl"]`, `theme.colors.neutral.greyBlue`; CountCircle (kolor tekstu) → `theme.tone.inverted`; tekst „Usuń zaznaczone” → `var(--color-danger-main)`.
- **DeleteAccountCard.tsx**: obramowanie karty, nagłówek, przycisk, „Potwierdzam” → `theme.colors.danger.border`, `theme.colors.danger.main` (useTheme).
- **NotificationsCard.tsx**: scrollbar → `theme.colors.neutral.greyBlue`; nieprzeczytane (tło, obramowanie) → `theme.colors.tint.t5`, `theme.colors.brand.info`; badge „NOWE” → `theme.colors.tint.t5`, `theme.colors.brand.info`, `theme.colors.neutral.greyBlue`.
- **QuestionCard.tsx**: IndexChip (kolor, tło, obramowanie) → `theme.colors.neutral.dGrey`, `theme.colors.tint.t5`, `theme.colors.neutral.greyBlue`.

---

## 1. Obecna implementacja

### 1.1 Architektura
- **Theme**: jeden plik `src/styles/theme.ts` z paletą (light).
- **PersonalizationContext**: nadpisuje `theme.colors`, `theme.tone` i część `theme.shadows` dla `eye-friendly` oraz `dark`.
- **Styled Components ThemeProvider**: theme jest przekazywany z kontekstu; przy zmianie `colorTheme` theme jest przeliczany w `getAdjustedTheme()` przy każdym renderze.

### 1.2 Co działa w dark mode
- Layout (MainLayout, PublicLayout) – tło z `theme.colors.neutral.silver` → w dark: `#121212`.
- Navbar container (Navbar.styles) – `theme.colors.neutral.white` → w dark: `#1e1e1e`.
- Wiele kart/boxów używających `theme.colors.neutral.white`, `theme.colors.neutral.greyBlue` itd. – dostosowują się.
- Sidebar – ikony z filtrem `brightness(0) invert(1)` w dark.
- StepCard (HowItWorks) – ten sam filtr na ikonach.

---

## 2. Zidentyfikowane niespójności

### 2.1 Globalne tło (krytyczne)
- **Plik**: `App.css`
- **Problem**: `body { background-color: #f9f9f9; }` – wartość na sztywno, niezależna od theme.
- **Efekt**: W dark mode strona ma szare tło zamiast ciemnego; widoczna „ramka” wokół aplikacji.

### 2.2 Navbar – avatar użytkownika
- **Plik**: `Navbar.tsx` (AvatarButton)
- **Problem**: `theme.colorTheme === 'eye-friendly' ? theme.colors.neutral.white : '#ffffff'` – dla dark używane jest `#ffffff`.
- **Efekt**: Przycisk avatara w dark mode ma białe tło zamiast ciemnego.

### 2.3 Cienie i elevation w dark
- **Plik**: `PersonalizationContext.tsx`
- **Problem**: W trybie dark nadpisywane są tylko `shadows["2px"]` i `shadows["4px"]`. `elevation` (sm, md, lg, xl, 2xl) oraz shadows 6px, 8px, 16px pozostają z light (rgba(171, 189, 209, ...)).
- **Efekt**: Karty i modale w dark mają jasne, niebieskawe cienie zamiast ciemnych.

### 2.4 Hardcoded kolory w komponentach (nie reagują na theme)

| Plik | Przykłady | Problem w dark |
|------|-----------|----------------|
| `QuestionsSection.tsx` | `#6b7280`, `#f3f4f6`, `#374151`, `rgba(76,175,80,0.12)` | Szary tekst i tła zawsze jasne |
| `GroupTabs.tsx` | `#f3f4f6`, `#374151`, `#f9fafb`, `#1d4ed8`, `#eff6ff`, `#2563eb`, `rgba(229,231,235,0.5)` | Segmenty i listy zawsze w light |
| `QuestionView.tsx` | `#6b7280`, `#fef2f2`, `#dc2626`, `#4f46e5`, `#e5e7eb`, `#4CAF50`, `rgba(...)` | Odpowiedzi, stany, obramowania light-only |
| `BulkActionBar.tsx` | `#d32f2f`, `rgba(0,0,0,0.2)`, `rgba(0,0,0,0.08)` | Tekst i cienie niezależne od theme |
| `ProfilePage/StatsCard.tsx` | `rgba(33,150,243,0.65)` itd. | Barwy słupków OK, ale obramowanie paska z theme – reszta spójna |
| `ProfilePage/NotificationsCard.tsx` | `#dcdcdc`, `rgba(33,150,243,...)`, `#e3f2fd`, `#1976d2`, `#bbdefb` | Scrollbar i przyciski zawsze jasne |
| `HelpPage/FAQItemCard.tsx` | `rgba(76,175,80,0.14)` | Tło aktywnego elementu light |
| `HelpPage/ContactForm.tsx` | Tło z theme | OK (theme) |
| `CreateTestAIPage/SourceSection.tsx` | `#2194f3`, `#48bb78`, `#e53e3e` | Ikony/statusy zawsze te same kolory |
| `CreateTestAIPage/constants.ts` | Pełna paleta easy/med/hard/closed/open | Wszystkie kolory na sztywno |
| `CreateTestAIPage/MaterialLibraryModal.tsx` | `white`, `#f9f9f9`, `rgba(0,0,0,0.1)` | Karty materiałów zawsze jasne |
| `LibraryPage/LibraryToolbar.tsx` | `rgba(76,175,79,0.15)` | Focus ring light |
| `LibraryPage/PreviewModal.tsx` | `rgba(0,0,0,0.5)` (overlay OK), `var(--color-danger-main, #c62828)` | Fallback bez ustawionej zmiennej |
| `SettingsPage/DeleteAccountCard.tsx` | `#fee2e2`, `#b91c1c` | Cała karta w light |
| `design-system/AlertBar.tsx` | `#1565c0`, `rgba(33,150,243,...)`, itd. | Wszystkie warianty na sztywno |
| `design-system/QuestionCard.tsx` | `#374151`, `#eef2ff`, `#dbeafe` | Zawsze light |
| `design-system/Modal.tsx` | `white`, `#f9f9f9`, `rgba(0,0,0,...)` | Overlay i wewnętrzne tła |
| `design-system/Tooltip.tsx` | `#ffffff`, `#1f2937`, `#d1d5db` | Zawsze light |
| `design-system/ChoiceEditor.tsx` | `#1565c0`, `rgba(33,150,243,0.12)` | Light-only |
| `design-system/CustomSelect.tsx` | `rgba(76,175,79,0.1)` (focus ring) | Drobne |
| `design-system/Segmented.ts` | `#1565c0`, `#6a1b9a`, rgba | Light-only |
| `design-system/Badge.ts` | Różne rgba | Semantyka OK, ale bez wariantów dark |
| `design-system/Button.ts` | `#ffffff`, `#1e88e5`, `#eef2f5`, rgba(76,175,80,...) | Przyciski secondary/outline |
| `design-system/Input.ts`, `Select.ts`, `Textarea.ts` | `#fff`, `#f5f5f5`, `#64b5f6`, rgba | Pola formularzy light |
| `design-system/CloseButton.tsx` | `rgba(0,0,0,0.05)` | Hover light |
| `design-system/Divider.ts` | `rgba(0,0,0,0.06)` | Linia zawsze jasna |
| `design-system/BottomSheet.tsx` | `rgba(0,0,0,0.45)` i inne | Overlay i uchwyt |
| `Sidebar.tsx` | `#777` (tekst „Brak wyników”) | Muted text light |
| `Sidebar.styles.ts` | `rgba(0,0,0,0.08/0.05)`, fallback `#ffebee` | Cienie i tła |
| `Navbar.styles.ts` | `#ff4d4f`, `rgba(0,0,0,0.2)` | Badge powiadomień |
| `Navbar.tsx` | `#d32f2f` (logout), box-shadow rgba | Dropdown / akcje |
| `MainLayout.tsx` | `rgba(0,0,0,0.35)` (overlay) | Można zostawić lub z theme |
| `TestDetailPage.tsx` | `var(--color-neutral-white, #fff)`, `stroke="#4CAF4F"` | Zmienne CSS nigdy nie ustawione; SVG na sztywno |

### 2.5 Zmienne CSS niewypełnione z theme
- Użycie: `var(--color-neutral-white, #fff)`, `var(--color-danger-main, #c62828)`.
- Nigdzie w aplikacji nie ustawia się `--color-*` z theme, więc zawsze używane są fallbacki (light).
- Brak jednego miejsca (np. w ThemeProvider lub w root layout), które synchronizuje theme ze zmiennymi CSS.

### 2.6 Inne
- **SearchBar.tsx** (Help): `$bg="#fff"` – zawsze biały.
- **AuthLayout.tsx**: `$bg="#fff"` – to samo.
- **PersonalizationContext**: brak override’u dla `danger` (main, bg, border, hover) w dark – czerwienie pozostają takie jak w light (można celowo, ale warto to zdecydować i ewentualnie przyciemnić dla dark).

---

## 3. Propozycja naprawy (enterprise-grade)

### 3.1 Zasady
1. **Jedno źródło prawdy**: wszystkie kolory z theme (light / eye-friendly / dark); zero hardcoded hex/rgba poza samą definicją theme.
2. **Semantyczne tokeny**: np. `surface.page`, `surface.card`, `text.primary`, `border.subtle`, `focus.ring` zamiast bezpośrednio `neutral.white` / `neutral.silver` (opcjonalnie, ale ułatwia dark i kolejne motywy).
3. **Pełna paleta per motyw**: dla dark (i ewentualnie eye-friendly) zdefiniować całość: neutral, brand, tint, shade, danger, tone, shadows, elevation.
4. **Globalne tło i root**: body oraz #root dostosowane do theme (np. przez zmienne CSS ustawiane z theme).
5. **Design system**: Button, Input, Select, Modal, Tooltip, Badge, AlertBar itd. używają wyłącznie theme (i ewentualnie zmiennych CSS z theme).

### 3.2 Kroki implementacyjne

#### Krok 1: Theme jako wielomotywowa struktura
- W `theme.ts` (lub `themes/`) wydzielić:
  - `themeLight` (obecny theme),
  - `themeDark` (pełna paleta dark: neutral, brand, tint, shade, danger, tone, shadows, elevation),
  - `themeEyeFriendly` (obecna logika z PersonalizationContext).
- W PersonalizationContext tylko wybór motywu i ewentualnie skalowanie typografii; bez duplikacji definicji kolorów w JSX.

#### Krok 2: Zmienne CSS z theme (optional but recommended)
- W komponencie opakowującym ThemeProvider (np. wrapper w App lub w PersonalizationProvider) po wyliczeniu `currentTheme` ustawić na `document.documentElement` (albo na elemencie wrapper):
  - `--color-neutral-white`, `--color-neutral-silver`, … (albo semantyczne: `--surface-card`, `--surface-page`, `--text-primary`, …).
- Zaktualizować `App.css`:  
  `body { background-color: var(--surface-page, #f9f9f9); }`  
  i upewnić się, że `--surface-page` jest ustawiane z `theme.colors.neutral.silver` (lub odpowiedniego tokenu).
- Wszystkie miejsca używające `var(--color-*, ...)` będą wtedy spójne z theme; można stopniowo zamieniać hardcoded wartości na zmienne.

#### Krok 3: Naprawa Navbar (avatar)
- AvatarButton: zamiast `'#ffffff'` / `'#f5f5f5'` użyć zawsze `theme.colors.neutral.white` i `theme.colors.neutral.silver` (lub tokenu hover), bez warunku na `colorTheme === 'eye-friendly'` (theme już jest wybrany).

#### Krok 4: Cienie i elevation w dark
- W `themeDark` uzupełnić cały obiekt `shadows` i `elevation` (np. rgba(0,0,0,0.3–0.6)), żeby karty i modale w dark miały ciemne cienie.

#### Krok 5: Usunięcie hardcoded kolorów w komponentach
- Dla każdego pliku z tabeli powyżej:
  - Zamienić hex/rgba na `theme.colors.*` lub `theme.tone.*` (albo na zmienne CSS z theme).
  - Warianty semantyczne (success, danger, info) – z theme: `theme.colors.danger.main`, `theme.colors.brand.info` itd.
- Szczególnie: GroupTabs, QuestionsSection, QuestionView, BulkActionBar, Modal, Tooltip, Input, Select, Button, AlertBar, QuestionCard, DeleteAccountCard, NotificationsCard, CreateTestAIPage (constants + SourceSection + MaterialLibraryModal), Library (PreviewModal, LibraryToolbar), Sidebar, Navbar.

#### Krok 6: SVG i ikony
- Ikony z kolorem (np. `stroke="#4CAF4F"`) – kolor z theme (np. `theme.colors.brand.primary`) lub zmienna CSS.
- Ring/loadery z `color="#2194f3"` – `theme.colors.brand.info`.

#### Krok 7: Stałe (constants)
- `CreateTestAIPage/constants.ts`: zamiast stałych kolorów – albo mapowanie wariantów na klucze theme (np. easy → success, hard → danger), albo osobna mała paleta w theme (np. `theme.colors.difficulty.easyBg`, `easyFg`) z wersjami dla light/dark.

#### Krok 8: Testy i QA
- Przełączenie na dark (Settings → Ciemny) i przejście po wszystkich ekranach: Dashboard, Test detail (tabs, pytania, bulk bar), Biblioteka, Profil, Ustawienia, Pomoc, Create test (AI + manual), Auth (login, register).
- Sprawdzenie kontrastu (WCAG 2.1 AA) dla tekstu i tła w dark.
- Sprawdzenie focus (outline/ring) w dark.

### 3.3 Struktura plików (sugestia)

```
src/
  styles/
    theme/
      index.ts        # getTheme(mode), typy
      light.ts
      dark.ts
      eyeFriendly.ts
  context/
    PersonalizationContext.tsx  # tylko wybór mode + ThemeProvider + opcjonalnie CSS vars
  App.css                       # body z var(--surface-page)
```

### 3.4 Semantyczne tokeny (opcjonalnie)

W theme rozszerzyć np.:

```ts
semantic: {
  surface: {
    page: string,      // neutral.silver
    card: string,      // neutral.white
    overlay: string,   // rgba(0,0,0,0.45) lub w dark jaśniejszy
  },
  text: {
    primary: string,
    secondary: string,
    muted: string,
  },
  border: {
    default: string,
    subtle: string,
  },
}
```

Wtedy komponenty używają `theme.semantic.surface.card` zamiast `theme.colors.neutral.white` – łatwiej dodawać nowe motywy i trzymać spójność.

---

## 4. Podsumowanie

| Obszar | Problem | Priorytet |
|--------|--------|-----------|
| Body background | #f9f9f9 na sztywno w App.css | Wysoki |
| Navbar avatar | #ffffff gdy nie eye-friendly (w tym dark) | Wysoki |
| Elevation/shadows w dark | Tylko 2px/4px; reszta light | Wysoki |
| Hardcoded w stronach | GroupTabs, QuestionsSection, QuestionView, BulkActionBar, … | Wysoki |
| Design system | Modal, Tooltip, Input, Select, Button, AlertBar, Badge, … | Wysoki |
| Stałe kolorów | constants.ts, CreateTestAIPage | Średni |
| Zmienne CSS | Brak synchronizacji theme → --color-* | Średni |
| Semantyczne tokeny | Brak; można dodać dla skalowalności | Niski |

Rekomendacja: najpierw Krok 1 (theme dark/light/eye-friendly), Krok 2 (body + zmienne CSS), Krok 3 (Navbar), Krok 4 (shadows). Potem systematycznie Krok 5 po modułach (design-system → strony), z testem wizualnym po każdym module.
