export const faqItems = [
  {
    id: 1,
    category: "Konto i logowanie",
    question: "Jak założyć konto w Inquizitorze?",
    answer:
      "Wystarczy przejść do strony rejestracji, podać adres e-mail, hasło oraz podstawowe dane. Po potwierdzeniu adresu e-mail możesz od razu generować testy.",
    tag: "konto",
  },
  {
    id: 2,
    category: "Konto i logowanie",
    question: "Zapomniałem hasła – co zrobić?",
    answer:
      "Na ekranie logowania wybierz opcję resetu hasła. Otrzymasz na maila link do ustawienia nowego hasła.",
    tag: "hasło",
  },
  {
    id: 3,
    category: "Generowanie testów",
    question: "Na podstawie jakich materiałów mogę wygenerować test?",
    answer:
      "Możesz wkleić własny tekst lub wgrać plik z materiałem dydaktycznym (PDF, DOCX, TXT, MD). System automatycznie przetworzy treść i wygeneruje pytania.",
    tag: "materiały",
  },
  {
    id: 4,
    category: "Generowanie testów",
    question: "Czy mogę kontrolować poziom trudności pytań?",
    answer:
      "Tak. Podczas generowania testu wybierasz liczbę pytań łatwych, średnich i trudnych. Algorytm dostosuje pytania do tych proporcji.",
    tag: "trudność",
  },
  {
    id: 5,
    category: "Edycja i eksport",
    question: "Czy mogę edytować wygenerowane pytania?",
    answer:
      "Tak. Każde pytanie możesz modyfikować: zmienić treść, odpowiedzi, poprawne warianty, a także usuwać i dodawać własne pytania.",
    tag: "edycja",
  },
  {
    id: 6,
    category: "Edycja i eksport",
    question: "W jakich formatach mogę pobrać test?",
    answer:
      "Test możesz wyeksportować do PDF lub XML, np. do późniejszego wykorzystania w innych systemach.",
    tag: "eksport",
  },
  {
    id: 7,
    category: "Bezpieczeństwo",
    question: "Czy moje testy i materiały są bezpieczne?",
    answer:
      "Tak. Dane są powiązane z Twoim kontem i nie są udostępniane innym użytkownikom. Dostęp do testów wymaga uwierzytelnienia.",
    tag: "bezpieczeństwo",
  },
  {
    id: 8,
    category: "Bezpieczeństwo",
    question: "Czy moje hasło jest zabezpieczone?",
    answer: "Tak. Twoje dane logowania są zapisywane w bezpiecznym miejscu pod kluczem.",
    tag: "bezpieczeństwo",
  },
  {
    id: 9,
    category: "Plany rozwoju",
    question: "Jakie funkcje planujecie dodać w najbliższym czasie?",
    answer:
      "Pracujemy m.in. nad stroną profilu z statystykami, dodatkowymi stronami informacyjnymi (FAQ, O nas), automatycznym generowaniem tytułów testów oraz łatwym udostępnianiem.",
    tag: "rozwój",
  },
  {
    id: 10,
    category: "Generowanie testów",
    question: "Czy mogę mieszać pytania otwarte i zamknięte?",
    answer:
      "Tak. Przy generowaniu podaj liczbę pytań otwartych oraz łączną liczbę zamkniętych. System wygeneruje test mieszany i poprawnie wyświetli oba typy na stronie szczegółów.",
    tag: "mieszane",
  },
  {
    id: 11,
    category: "Generowanie testów",
    question: "Czy określę dokładnie typy pytań zamkniętych (P/F, jednokrotne, wielokrotne)?",
    answer:
      "Tak. W sekcji struktury pytań ustaw osobno liczbę pozycji typu Prawda/Fałsz, Jednokrotnego i Wielokrotnego wyboru. Generator rozłoży je zgodnie z tymi wartościami.",
    tag: "typy",
  },
  {
    id: 12,
    category: "Materiały",
    question: "Jakie formaty plików są obsługiwane i czy są limity rozmiaru?",
    answer:
      "Obsługujemy PDF, DOCX, TXT oraz MD. Im większy plik, tym dłuższe przetwarzanie. Jeśli import trwa zbyt długo, rozważ podział materiału na mniejsze części.",
    tag: "formaty",
  },
  {
    id: 13,
    category: "Edycja i eksport",
    question: "Czy mogę zmienić tytuł testu po wygenerowaniu?",
    answer:
      "Tak. Na stronie szczegółów testu kliknij ikonę edycji obok tytułu, wprowadź nową nazwę i zapisz. Lista po lewej (sidebar) zaktualizuje się automatycznie.",
    tag: "tytuł",
  },
  {
    id: 14,
    category: "Nawigacja",
    question: "Nie widzę nowego testu w sidebarze - co zrobić?",
    answer:
      "Sidebar odświeża się automatycznie po utworzeniu/edycji. Jeśli nadal go nie widać, przejdź na Dashboard lub odśwież stronę przeglądarki.",
    tag: "sidebar",
  },
  {
    id: 15,
    category: "Konto i logowanie",
    question: "Co jeśli sesja wygaśnie po 60 minutach?",
    answer:
      "Po wygaśnięciu tokenu niektóre akcje sieciowe przestaną działać i zostaniesz poproszony(-a) o ponowne logowanie. Po zalogowaniu możesz kontynuować pracę.",
    tag: "sesja",
  },
  {
    id: 16,
    category: "Błędy",
    question: "Wszedłem na nieistniejącą stronę i widzę pustą stronę — co to znaczy?",
    answer:
      "Dla niezalogowanych przekierowujemy na logowanie, a dla zalogowanych na Dashboard. Jeśli widzisz pusty widok, spróbuj wejść przez menu lub odświeżyć stronę.",
    tag: "404",
  },
  {
    id: 17,
    category: "Bezpieczeństwo",
    question: "Czy da się ukryć hasło w podglądzie żądań (DevTools)?",
    answer:
      "Nie. Przeglądarka pokazuje faktycznie wysyłane dane. Zapewniamy bezpieczeństwo transmisji (HTTPS) i nie logujemy haseł po stronie serwera.",
    tag: "hasło-devtools",
  },
  {
    id: 18,
    category: "Edycja i eksport",
    question: "Czy mogę usuwać pytania lub całe testy?",
    answer:
      "Tak. Na stronie szczegółów testu możesz usuwać pojedyncze pytania lub cały test. Operacja usunięcia jest nieodwracalna.",
    tag: "usuwanie",
  },
  {
    id: 19,
    category: "Edycja i eksport",
    question: "Czy pobiorę test z odpowiedziami?",
    answer:
      "PDF generujemy w wersji dla ucznia (bez odpowiedzi). Plik XML zawiera komplet informacji, w tym poprawne odpowiedzi do pytań zamkniętych.",
    tag: "odpowiedzi",
  },
] as const;

export const categoriesOrder = [
  "Konto i logowanie",
  "Bezpieczeństwo",
  "Generowanie testów",
  "Edycja i eksport",
  "Nawigacja",
  "Błędy",
  "Materiały",
  "Plany rozwoju",
] as const;

export type FAQItem = (typeof faqItems)[number];
