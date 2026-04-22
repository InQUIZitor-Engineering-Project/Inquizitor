from __future__ import annotations

import json
from typing import Any


class PromptBuilder:
    """
    Centralized utility for building consistent prompts for LLM.
    Ensures persona, formatting (LaTeX), and constraints are shared across all features.
    """

    PERSONA = (
        "Pracujesz jako doświadczony autor podręczników i projektant wyzwań "
        "dydaktycznych, który kładzie nacisk na rozumienie koncepcji i "
        "praktyczne zastosowanie wiedzy."
    )

    LATEX_RULES = (
        "- Jeśli w treści pytania lub odpowiedzi pojawia się zapis matematyczny "
        "(wzór, równanie, wyrażenie), zapisuj go w składni LaTeX.\n"
        '- Dla matematyki w tekście używaj WYŁĄCZNIE formatu "$...$", np.: '
        '`"text": "Ile wynosi $x^2 + y^2$?"`.\n'
        '- Dla osobnych wzorów możesz użyć `$$...$$`, np.: '
        '`"text": "Podaj wynik: $$\\int_0^1 x^2\\,dx$$"`.\n'
        "- Nie używaj innych notacji (takich jak \\( ... \\), \\[ ... \\], "
        "HTML, Markdown).\n"
        "- Upewnij się, że wszystkie backslash'e w LaTeX są poprawnie zapisane "
        'in JSON (np. "$\\frac{1}{2}$").'
    )

    SOURCE_MATERIAL_FRAMING = (
        "### ROLA MATERIAŁU ŹRÓDŁOWEGO\n"
        "Materiał źródłowy służy WYŁĄCZNIE jako:\n"
        "  (a) baza merytoryczna wyznaczająca zakres tematu,\n"
        "  (b) punkt odniesienia dla poziomu szczegółowości i trudności,\n"
        "  (c) źródło koncepcji, reguł i zależności, które mają być sprawdzone.\n"
        "Materiał NIE jest tekstem do analizy czytelniczej ani szablonem, "
        "który należy odtworzyć. Pytania mają sprawdzać rozumienie zawartych "
        "w nim koncepcji, a NIE rozpoznanie jego dosłownego brzmienia."
    )

    TRANSFER_PRINCIPLE = (
        "### ZASADA TRANSFERU (PRIORYTET KRYTYCZNY)\n"
        "Dobre pytanie sprawdza, czy uczeń potrafi ZASTOSOWAĆ wiedzę w nowej "
        "sytuacji — nie czy zapamiętał dosłowne brzmienie materiału.\n"
        "- BEZWZGLĘDNY ZAKAZ fraz typu: 'w tekście', 'według autora', "
        "'zgodnie z materiałem', 'w rozdziale', 'na stronie', "
        "'w podanym fragmencie', 'jak napisano powyżej'.\n"
        "- Każde pytanie musi brzmieć jak samodzielny, autonomiczny problem, "
        "zrozumiały dla osoby, która nie widziała materiału źródłowego.\n"
        "- Preferuj scenariusze, przypadki praktyczne i zastosowania koncepcji "
        "w nowych kontekstach (inna branża, inne dane, inny przykład) przy "
        "zachowaniu tej samej koncepcji i poziomu trudności."
    )

    CONCEPT_VS_DATA_SEPARATION = (
        "### ODDZIELENIE KONCEPCJI OD DANYCH (PRIORYTET KRYTYCZNY)\n"
        "Kiedy tworzysz nowe pytanie na podstawie istniejącego "
        "(regeneracja, wariant, transformacja), traktuj pytanie wejściowe "
        "WYŁĄCZNIE jako specyfikację dwóch rzeczy:\n"
        "  (1) KONCEPCJI / UMIEJĘTNOŚCI, która ma być sprawdzona,\n"
        "  (2) POZIOMU TRUDNOŚCI.\n"
        "Nowy wariant MUSI być całkowicie nowym zadaniem. "
        "OBOWIĄZUJĄ BEZWZGLĘDNE ZAKAZY:\n"
        "- ZAKAZ reużywania konkretnych liczb, wartości, wyników, procentów, "
        "kwot, jednostek, pomiarów występujących w oryginale.\n"
        "- ZAKAZ reużywania nazw własnych: imion, nazwisk, firm, miast, "
        "krajów, produktów, marek, instytucji, dat.\n"
        "- ZAKAZ reużywania tego samego scenariusza lub kontekstu "
        "sytuacyjnego. Jeśli oryginał dotyczy sklepu — użyj fabryki, "
        "szpitala, gospodarstwa rolnego. Jeśli dotyczy Kowalskiego — użyj "
        "innej osoby. Jeśli dotyczy pociągu — użyj samolotu lub statku.\n"
        "- ZAKAZ parafrazowania tej samej sytuacji innymi słowami — to nie "
        "jest nowy wariant, to kopia.\n"
        "- ZAKAZ zachowywania tej samej kolejności liczb, opcji lub kroków "
        "rozumowania.\n"
        "WYMAGANE:\n"
        "- Zbuduj nowy przykład / scenariusz od zera.\n"
        "- Jedyne, co łączy oryginał z wariantem, to KONCEPCJA (np. "
        "'obliczanie procentu składanego', 'interpretacja wykresu funkcji "
        "kwadratowej', 'rozpoznanie błędu logicznego') i POZIOM TRUDNOŚCI.\n"
        "- Poprawna odpowiedź w nowym wariancie musi wynikać z treści "
        "nowego pytania, nie z danych oryginału."
    )

    GENERAL_CONSTRAINTS = (
        "- Każde pytanie i wszystkie odpowiedzi muszą być w języku polskim.\n"
        "- NIE numeruj treści pytań ani odpowiedzi: nie dodawaj prefiksów typu "
        "'1.', 'Pytanie 1', '-', '•' ani innych numerów w polach `text` i "
        "`choices`.\n"
        "- Nie twórz pytań o strukturę dokumentu ani metapoziom (np. "
        "'co jest w treści 3 zadania', 'ile jest punktów', 'jaki jest tytuł "
        "sekcji'). Skup się wyłącznie na merytorycznej treści.\n"
        "- Preferuj pytania sprawdzające zrozumienie pojęć, relacji i "
        "wnioskowanie nad czystym zapamiętywaniem faktów.\n"
        "- Pytania muszą być jednoznaczne, poprawne merytorycznie i mieć "
        "jasno zdefiniowaną poprawną odpowiedź."
    )

    CITATIONS_SEMANTICS = (
        "### ZNACZENIE POLA `citations`\n"
        "Pole `citations` to WEWNĘTRZNE UZASADNIENIE poprawności odpowiedzi "
        "dla nauczyciela — krótki fragment materiału (1-3 pozycje) "
        "potwierdzający, że koncepcja sprawdzana w pytaniu faktycznie "
        "występuje w źródle.\n"
        "- `citations` NIE jest fragmentem, który uczeń ma rozpoznać, "
        "zacytować ani odnaleźć w pytaniu.\n"
        "- Treść pytania NIE MOŻE nawiązywać do istnienia tego cytatu ani "
        "go powtarzać.\n"
        "- Jeśli pytanie jest zastosowaniem koncepcji w nowym scenariuszu "
        "(zgodnie z Zasadą Transferu), cytat ma potwierdzać KONCEPCJĘ, "
        "nie konkretny scenariusz pytania."
    )

    @classmethod
    def build_full_test_prompt(cls, text: str, params: Any) -> str:
        """Prompt for generating a complete new test."""
        closed_p = params.closed
        c_total = (
            closed_p.true_false + closed_p.single_choice + closed_p.multi_choice
        )

        parts = [
            cls.PERSONA,
            (
                f"Twoim zadaniem jest przygotowanie testu ({c_total} pytań "
                f"zamkniętych, {params.num_open} pytań otwartych) na podstawie "
                "dostarczonego materiału w formacie Markdown."
            ),
            "",
            cls.SOURCE_MATERIAL_FRAMING,
            "",
            cls.TRANSFER_PRINCIPLE,
            "",
            (
                "### STRUKTURA TESTU\n"
                "Pytania zamknięte:\n"
                f"- Prawda/Fałsz: {closed_p.true_false}\n"
                f"- Jednokrotnego wyboru: {closed_p.single_choice}\n"
                "- Wielokrotnego wyboru (co najmniej dwie poprawne "
                f"odpowiedzi): {closed_p.multi_choice}\n"
                f"Rozkład trudności: {params.easy} łatwych, {params.medium} "
                f"średnich, {params.hard} trudnych."
            ),
            "",
            "### WYMAGANY FORMAT ODPOWIEDZI (JSON)",
            "Zwróć WYŁĄCZNIE poprawny obiekt JSON o następującej strukturze:",
            "{",
            '  "title": "Krótki tytuł testu po polsku",',
            '  "questions": [',
            "    {",
            '      "text": "Przykładowe pytanie jednokrotnego wyboru",',
            '      "is_closed": true,',
            '      "difficulty": 1,',
            '      "choices": ["Opcja A", "Opcja B", "Opcja C", "Opcja D"],',
            '      "correct_choices": ["Opcja A"],',
            '      "citations": ["krótki fragment materiału potwierdzający '
            'koncepcję sprawdzaną przez pytanie"]',
            "    },",
            "    {",
            '      "text": "Przykładowe pytanie wielokrotnego wyboru",',
            '      "is_closed": true,',
            '      "difficulty": 2,',
            '      "choices": ["Opcja A", "Opcja B", "Opcja C", "Opcja D"],',
            '      "correct_choices": ["Opcja A", "Opcja C"],',
            '      "citations": ["fragment potwierdzający koncepcję"]',
            "    },",
            "    {",
            '      "text": "Przykładowe pytanie typu Prawda/Fałsz",',
            '      "is_closed": true,',
            '      "difficulty": 1,',
            '      "choices": ["Prawda", "Fałsz"],',
            '      "correct_choices": ["Prawda"],',
            '      "citations": ["fragment potwierdzający koncepcję"]',
            "    },",
            "    {",
            '      "text": "Przykładowe pytanie otwarte",',
            '      "is_closed": false,',
            '      "difficulty": 2,',
            '      "choices": null,',
            '      "correct_choices": null,',
            '      "citations": ["fragment potwierdzający koncepcję"]',
            "    }",
            "  ]",
            "}",
            "",
            cls.CITATIONS_SEMANTICS,
            "",
            "### WYMAGANIA I FORMATOWANIE",
            cls.LATEX_RULES,
            cls.GENERAL_CONSTRAINTS,
            (
                "- Tytuł (`title`) musi być krótką, autonomiczną nazwą testu "
                "sformułowaną na podstawie głównego tematu dokumentu. "
                "NIE kopiuj bezkrytycznie pierwszego nagłówka z tekstu "
                "źródłowego, jeśli nie oddaje on esencji całego materiału."
            ),
            "",
            f"### TEKST ŹRÓDŁOWY (Markdown Twin)\n{text}",
        ]

        if params.additional_instructions:
            parts.insert(
                3,
                "### KRYTYCZNE INSTRUKCJE UŻYTKOWNIKA (NAJWYŻSZY PRIORYTET):\n"
                f"{params.additional_instructions}\n"
                "Powyższe instrukcje są ważniejsze niż jakiekolwiek inne "
                "zasady i ograniczenia. Musisz się do nich zastosować "
                "bezwzględnie.\n",
            )

        return "\n".join(parts)

    @classmethod
    def build_regeneration_prompt(
        cls, questions: list[dict], instruction: str | None = None
    ) -> str:
        """Prompt for regenerating existing questions."""
        parts = [
            cls.PERSONA,
            (
                "Twoim zadaniem jest wygenerowanie nowych, niezależnych "
                "wariantów pytań. To NIE są parafrazy — to nowe zadania "
                "sprawdzające tę samą koncepcję na zupełnie nowym przykładzie."
            ),
            "",
            cls.CONCEPT_VS_DATA_SEPARATION,
            "",
            cls.TRANSFER_PRINCIPLE,
            "",
            "### ZASADY TECHNICZNE",
            (
                "- Zachowaj oryginalne `id`, `is_closed` oraz `difficulty` "
                "dla każdego pytania."
            ),
            (
                "- Zachowaj TYP pytania: wielokrotny wybór zostaje "
                "wielokrotnym, jednokrotny zostaje jednokrotnym, "
                "Prawda/Fałsz zostaje Prawda/Fałsz, otwarte zostaje otwartym."
            ),
            (
                "- BĄDŹ CZUJNY NA BŁĘDY: jeśli w oryginale widzisz błąd "
                "merytoryczny, językowy lub logiczny, NAPRAW GO w nowym "
                "wariancie — i tak zbuduj ten wariant na całkowicie nowych "
                "danych."
            ),
            (
                "- Nowe pytania muszą być bezbłędne, jednoznaczne, "
                "dydaktycznie wartościowe i mieć poprawną odpowiedź "
                "wynikającą wyłącznie z treści nowego pytania."
            ),
            "",
            "### WYMAGANY FORMAT ODPOWIEDZI (JSON)",
            "Zwróć WYŁĄCZNIE listę obiektów JSON (Array) o strukturze:",
            (
                '[ {"id": 123, "text": "...", "is_closed": true, '
                '"difficulty": 1, "choices": ["...", "..."], '
                '"correct_choices": ["..."]} ]'
            ),
            "",
            "### WYMAGANIA I FORMATOWANIE",
            cls.LATEX_RULES,
            cls.GENERAL_CONSTRAINTS,
            "",
        ]

        if instruction:
            parts.append(
                "### KRYTYCZNE INSTRUKCJE UŻYTKOWNIKA (WYSOKI PRIORYTET):\n"
                f"{instruction}\n"
            )

        parts.append(
            "### PYTANIA WEJŚCIOWE\n"
            "UWAGA: poniższe pytania potraktuj WYŁĄCZNIE jako specyfikację "
            "koncepcji i poziomu trudności — NIE jako szablon do parafrazy. "
            "Konkretne dane, liczby, nazwy własne i scenariusze z poniższego "
            "JSON-a NIE MOGĄ wystąpić w Twojej odpowiedzi. Przed każdym "
            "nowym wariantem mentalnie odpowiedz sobie: „jakiej koncepcji "
            "i jakiego poziomu trudności dotyczy oryginał?” — i na tej "
            "podstawie zbuduj nowe zadanie od zera.\n\n"
            f"{json.dumps(questions, ensure_ascii=False)}"
        )
        return "\n".join(parts)

    @classmethod
    def build_conversion_prompt(cls, questions: list[dict]) -> str:
        """Prompt for converting open questions to closed ones."""
        parts = [
            cls.PERSONA,
            (
                "Twoim zadaniem jest przekształcenie pytań OTWARTYCH w pytania "
                "ZAMKNIĘTE (wyboru). To operacja zmiany FORMATU: przedmiot "
                "merytoryczny pytania pozostaje ten sam, zmienia się tylko "
                "sposób udzielania odpowiedzi."
            ),
            "",
            "### ZASADY",
            "- Stwórz 4 sensowne opcje wyboru (`choices`).",
            (
                "- Wskaż co najmniej jedną poprawną odpowiedź "
                "(`correct_choices`)."
            ),
            (
                "- Możesz lekko zmodyfikować pole `text`, aby pasowało do "
                "formatu pytania zamkniętego, ale ZACHOWAJ przedmiot pytania."
            ),
            "- Zachowaj oryginalne `id` i `difficulty`.",
            (
                "- UNIKAJ pytań o metodę rozwiązania lub teorię (np. 'Jak "
                "należy obliczyć...', 'Który wzór jest poprawny...'). "
                "ZAMIAST TEGO stwórz bezpośrednie pytanie o wynik, fakt lub "
                "informację. Opcje wyboru powinny być konkretnymi "
                "wartościami, nazwami lub odpowiedziami merytorycznymi."
            ),
            (
                "- Dystraktory (niepoprawne opcje) muszą być wiarygodne: "
                "prawdopodobne błędy ucznia lub typowe pomyłki obliczeniowe, "
                "nie absurdy i nie opcje ewidentnie błędne."
            ),
            "",
            "### WYMAGANY FORMAT ODPOWIEDZI (JSON)",
            "Zwróć WYŁĄCZNIE listę obiektów JSON (Array) o strukturze:",
            (
                '[ {"id": 456, "text": "...", "is_closed": true, '
                '"difficulty": 2, "choices": ["...", "..."], '
                '"correct_choices": ["..."]} ]'
            ),
            "",
            "### WYMAGANIA I FORMATOWANIE",
            cls.LATEX_RULES,
            cls.GENERAL_CONSTRAINTS,
            "",
            "### PYTANIA DO KONWERSJI (JSON)",
            f"{json.dumps(questions, ensure_ascii=False)}",
        ]
        return "\n".join(parts)

    @classmethod
    def build_closed_to_open_prompt(cls, questions: list[dict]) -> str:
        """
        Prompt for converting closed questions back to open ones.
        """
        parts = [
            cls.PERSONA,
            (
                "Twoim zadaniem jest przekształcenie pytań ZAMKNIĘTYCH "
                "(wyboru) w pytania OTWARTE. To operacja zmiany FORMATU: "
                "przedmiot merytoryczny pytania pozostaje ten sam, zmienia "
                "się tylko sposób udzielania odpowiedzi."
            ),
            (
                "Otrzymasz treść pytania, opcje wyboru oraz poprawne "
                "odpowiedzi jako kontekst."
            ),
            "",
            "### ZASADY",
            (
                "- PRZEREDAGUJ treść pytania (pole `text`) tak, aby było "
                "samodzielnym pytaniem otwartym."
            ),
            (
                "- USUŃ wszelkie nawiązania do wyboru opcji (np. 'Która z "
                "podanych...', 'Z poniższych odpowiedzi...', 'Wskaż...')."
            ),
            (
                "- WYKORZYSTAJ informacje z poprawnych odpowiedzi, aby "
                "pytanie było precyzyjne i miało jednoznaczną odpowiedź."
            ),
            "- Zachowaj oryginalne `id` i `difficulty`.",
            (
                "- Pytanie musi być sformułowane tak, aby uczeń musiał "
                "samodzielnie sformułować odpowiedź, nie tylko ją wybrać."
            ),
            "",
            "### WYMAGANY FORMAT ODPOWIEDZI (JSON)",
            "Zwróć WYŁĄCZNIE listę obiektów JSON (Array) o strukturze:",
            '[ {"id": 789, "text": "...", "difficulty": 1} ]',
            "",
            "### WYMAGANIA I FORMATOWANIE",
            cls.LATEX_RULES,
            cls.GENERAL_CONSTRAINTS,
            "",
            "### PYTANIA DO KONWERSJI Z KONTEKSTEM (JSON)",
            f"{json.dumps(questions, ensure_ascii=False)}",
        ]
        return "\n".join(parts)

    @classmethod
    def build_document_analysis_prompt(
        cls, *, text: str, filename: str | None, mime_type: str | None
    ) -> str:
        """
        Prompt for generating a Markdown "document twin" from source text.
        """
        context = []
        if filename:
            context.append(f"Nazwa pliku: {filename}")
        if mime_type:
            context.append(f"MIME: {mime_type}")
        context_header = "\n".join(context)

        parts = [
            cls.PERSONA,
            (
                "Twoim zadaniem jest przygotowanie precyzyjnego opisu dokumentu "
                "w Markdown oraz sklasyfikowanie poziomu analizy (fast/reasoning)."
            ),
            "",
            "### WYMAGANY FORMAT ODPOWIEDZI (JSON):",
            "{",
            '  "routing_tier": "fast | reasoning",',
            '  "markdown_twin": "Pełny opis dokumentu w Markdown",',
            '  "suggested_title": "Krótki, merytoryczny tytuł dokumentu po polsku"',
            "}",
            "",
            "Wymagania i formatowanie:",
            cls.LATEX_RULES,
            "",
            "Zasady:",
            "- Tytuł (`suggested_title`) musi być zwięzły (2-5 słów) "
            "i oddawać główny temat materiału.",
            "- Zachowaj kolejność treści z dokumentu.",
            "- Opisuj diagramy/rysunki tekstowo, zachowując relacje.",
            "- Nie dodawaj informacji spoza materiału.",
            "- Użyj 'reasoning' jeśli dokument jest złożony, zawiera schematy, "
            "tabele, rysunki lub jest skanem/obrazem; inaczej 'fast'.",
            "",
        ]
        if context_header:
            parts.append(f"Kontekst:\n{context_header}\n")
        if text.strip():
            parts.append(f"Tekst źródłowy:\n{text}")
        else:
            parts.append(
                "Tekst źródłowy nie został dostarczony. "
                "Analizuj na podstawie załączonego pliku."
            )

        return "\n".join(parts)
