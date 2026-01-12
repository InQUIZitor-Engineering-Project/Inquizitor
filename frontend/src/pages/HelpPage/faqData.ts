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
    id: 15,
    category: "Konto i logowanie",
    question: "Co jeśli sesja wygaśnie po 60 minutach?",
    answer:
      "Po wygaśnięciu tokenu niektóre akcje sieciowe przestaną działać i zostaniesz poproszony(-a) o ponowne logowanie. Po zalogowaniu możesz kontynuować pracę.",
    tag: "sesja",
  },
  {
    id: 3,
    category: "Generowanie testów",
    question: "Na podstawie jakich materiałów mogę wygenerować test?",
    answer:
      "Możesz wkleić własny tekst lub wgrać plik z materiałem dydaktycznym. Obsługujemy pliki tekstowe (PDF, DOCX, TXT, MD) oraz graficzne (JPG, PNG) – system sam rozpozna treść ze zdjęć.",
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
    id: 10,
    category: "Generowanie testów",
    question: "Czy mogę mieszać pytania otwarte i zamknięte?",
    answer:
      "Tak. Przy generowaniu podaj liczbę pytań otwartych oraz łączną liczbę zamkniętych. System wygeneruje test mieszany i wyświetli oba typy na stronie szczegółów.",
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
      "Obsługujemy dokumenty tekstowe: PDF, DOCX, TXT, MD oraz pliki graficzne: JPG i PNG. Im większy plik, tym dłuższe przetwarzanie. W przypadku bardzo obszernych materiałów warto podzielić je na mniejsze części.",
    tag: "formaty",
  },
  {
    id: 5,
    category: "Edycja i eksport",
    question: "Czy mogę edytować wygenerowane pytania?",
    answer:
      "Tak. Każde pytanie możesz modyfikować: zmienić treść, odpowiedzi, poprawne warianty, a także usuwać i dodawać własne pytania ręcznie.",
    tag: "edycja",
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
    id: 18,
    category: "Edycja i eksport",
    question: "Czy mogę usuwać pytania lub całe testy?",
    answer:
      "Tak. Na stronie szczegółów testu możesz usuwać pojedyncze pytania lub cały test. Pamiętaj, że operacja usunięcia testu jest nieodwracalna.",
    tag: "usuwanie",
  },
  {
    id: 6,
    category: "Edycja i eksport",
    question: "W jakich formatach mogę pobrać gotowy test?",
    answer:
      "Test wyeksportujesz do PDF (gotowy do druku) lub XML (do importu w innych systemach).",
    tag: "eksport",
  },
  {
    id: 19,
    category: "Edycja i eksport",
    question: "Jakie opcje personalizacji posiada plik PDF?",
    answer:
      "Nasz generator PDF pozwala na dodanie miejsca na imię i nazwisko ucznia, pola na brudnopis, stworzenie dwóch grup testowych (z mieszaniem pytań) oraz dołączenie osobnej strony z kluczem odpowiedzi.",
    tag: "pdf-opcje",
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
    answer: "Tak. Twoje dane logowania są haszowane i przechowywane w bezpiecznej bazie danych.",
    tag: "bezpieczeństwo",
  },
{
    id: 17,
    category: "Konto i logowanie",
    question: "Czy korzystanie z Inquizitora jest płatne?",
    answer:
      "Nie, aplikacja jest w pełni darmowa. Wszystkie funkcje – w tym generowanie testów z użyciem AI, OCR oraz eksport do PDF – są dostępne dla każdego zarejestrowanego użytkownika bez żadnych opłat.",
    tag: "koszty",
  },
  {
    id: 14,
    category: "Nawigacja",
    question: "Nie widzę nowego testu w pasku bocznym - co zrobić?",
    answer:
      "Pasek boczny odświeża się automatycznie po utworzeniu/edycji. Jeśli nadal go nie widać, przejdź na panel główny lub odśwież stronę przeglądarki.",
    tag: "pasek boczny",
  },
  {
    id: 16,
    category: "Błędy",
    question: "Wszedłem na nieistniejącą stronę i widzę pusty ekran - co to znaczy?",
    answer:
      "System stara się przekierować na panel główny lub stronę logowania. Jeśli widzisz pusty widok, spróbuj odświeżyć stronę lub skorzystać z menu nawigacyjnego.",
    tag: "404",
  },
  {
    id: 9,
    category: "Plany rozwoju",
    question: "Jakie funkcje planujecie dodać w najbliższym czasie?",
    answer:
      "Pracujemy nad możliwością dodawania obrazków bezpośrednio do treści pytań oraz nad ulepszeniem silnika OCR, by jeszcze lepiej rozpoznawał tekst i wzory ze zdjęć i skanów.",
    tag: "rozwój",
  },
  {
    id: 20,
    category: "Generowanie testów",
    question: "Czy wygenerowane pytania są zawsze poprawne merytorycznie?",
    answer:
      "Korzystamy z zaawansowanych modeli językowych, które są bardzo skuteczne, ale mogą sporadycznie popełniać błędy. Zalecamy, abyś zawsze przejrzał i zweryfikował test przed udostępnieniem go dalej.",
    tag: "weryfikacja",
  },
  {
    id: 21,
    category: "Edycja i eksport",
    question: "Do czego mogę wykorzystać format Moodle XML?",
    answer:
      "Format ten zapewnia kompatybilność z platformami e-learningowymi (np. Moodle). Pozwala też na bezpośredni import pytań do zewnętrznych gier edukacyjnych, takich jak aplikacja Quizzobara.",
    tag: "integracja",
  },
] as const;

export const categoriesOrder = [
  "Konto i logowanie",
  "Bezpieczeństwo",
  "Generowanie testów",
  "Edycja i eksport",
  "Materiały",
  "Nawigacja",
  "Błędy",
  "Plany rozwoju",
] as const;

export type FAQItem = (typeof faqItems)[number];
