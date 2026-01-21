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

    GENERAL_CONSTRAINTS = (
        "- Każde pytanie i wszystkie odpowiedzi muszą być w języku polskim.\n"
        "- NIE numeruj treści pytań ani odpowiedzi: nie dodawaj prefiksów typu "
        "'1.', 'Pytanie 1', '-', '•' ani innych numerów w polach `text` i "
        "`choices`.\n"
        "- Nie twórz pytań o strukturę dokumentu ani metapoziom (np. "
        "'co jest w treści 3 zadania', 'ile jest punktów', 'jaki jest tytuł "
        "sekcji'). Skup się wyłącznie na merytorycznej treści.\n"
        "- Traktuj tekst źródłowy jako **bazę wiedzy i źródło merytoryczne**, "
        "a nie jako treść do analizy czytelniczej.\n"
        "- **ZAKAZ** używania fraz typu: 'w tekście', 'według autora', "
        "'zgodnie z materiałem'. Pytanie musi brzmieć jak samodzielny problem.\n"
        "- **Zasada Transferu**: Zamiast pytać o cytaty, twórz pytania oparte "
        "na scenariuszach lub przykładach, które wymagają zastosowania wiedzy "
        "z tekstu w nowej sytuacji.\n"
        "- Preferuj pytania sprawdzające zrozumienie pojęć, relacji i "
        "wnioskowanie niż czyste zapamiętywanie faktów."
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
                "materiału."
            ),
            (
                "Struktura pytań zamkniętych:\n"
                f"- Prawda/Fałsz: {closed_p.true_false}\n"
                f"- Jednokrotnego wyboru: {closed_p.single_choice}\n"
                "- Wielokrotnego wyboru (co najmniej dwie poprawne odpowiedzi): "
                f"{closed_p.multi_choice}"
            ),
            (
                f"Rozkład trudności: {params.easy} łatwych, {params.medium} "
                f"średnich, {params.hard} trudnych."
            ),
            "",
            "### WYMAGANY FORMAT ODPOWIEDZI (JSON):",
            "Zwróć WYŁĄCZNIE poprawny obiekt JSON o następującej strukturze:",
            "{",
            '  "title": "Krótki tytuł testu po polsku",',
            '  "questions": [',
            '    {',
            '      "text": "Przykładowe pytanie jednokrotnego wyboru",',
            '      "is_closed": true,',
            '      "difficulty": 1,',
            '      "choices": ["Opcja A", "Opcja B", "Opcja C", "Opcja D"],',
            '      "correct_choices": ["Opcja A"]',
            '    },',
            '    {',
            '      "text": "Przykładowe pytanie wielokrotnego wyboru",',
            '      "is_closed": true,',
            '      "difficulty": 2,',
            '      "choices": ["Opcja A", "Opcja B", "Opcja C", "Opcja D"],',
            '      "correct_choices": ["Opcja A", "Opcja C"]',
            '    },',
            '    {',
            '      "text": "Przykładowe pytanie typu Prawda/Fałsz",',
            '      "is_closed": true,',
            '      "difficulty": 1,',
            '      "choices": ["Prawda", "Fałsz"],',
            '      "correct_choices": ["Prawda"]',
            '    },',
            '    {',
            '      "text": "Przykładowe pytanie otwarte", "is_closed": false, ',
            '      "difficulty": 2, "choices": null, "correct_choices": null',
            '    }',
            '  ]',
            "}",
            "",
            "Wymagania i formatowanie:",
            cls.LATEX_RULES,
            cls.GENERAL_CONSTRAINTS,
            "",
            f"Tekst źródłowy:\n{text}",
        ]

        if params.additional_instructions:
            parts.insert(
                3,
                "### KRYTYCZNE INSTRUKCJE UŻYTKOWNIKA (NAJWYŻSZY PRIORYTET):\n"
                f"{params.additional_instructions}\n"
                "Powyższe instrukcje są ważniejsze niż jakiekolwiek inne zasady "
                "i ograniczenia. Musisz się do nich zastosować bezwzględnie.\n"
            )

        return "\n".join(parts)

    @classmethod
    def build_regeneration_prompt(
        cls, questions: list[dict], instruction: str | None = None
    ) -> str:
        """Prompt for regenerating existing questions."""
        parts = [
            cls.PERSONA,
            "Twoim zadaniem jest wygenerowanie nowych wariantów dla pytań.",
            "Zasady:",
            (
                "- Zachowaj oryginalne 'id', 'is_closed' oraz 'difficulty' "
                "dla każdego pytania."
            ),
            (
                "- Zachowaj typ pytania: jeśli oryginalne pytanie jest "
                "wielokrotnego wyboru (ma wiele poprawnych odpowiedzi), "
                "nowy wariant RÓWNIEŻ musi być wielokrotnego wyboru."
            ),
            (
                "- Zmień treść pytania i opcje tak, aby sprawdzały tę samą "
                "wiedzę, ale w nowy sposób (np. inne dane liczbowe, inne "
                "przykłady)."
            ),
            (
                "- BĄDŹ CZUJNY NA BŁĘDY: Jeśli w wejściowym pytaniu widzisz "
                "błąd merytoryczny, językowy lub logiczny, NAPRAW GO w nowym "
                "wariancie."
            ),
            "- Nowe pytania muszą być bezbłędne, jasne i dydaktycznie wartościowe.",
            "",
            "### WYMAGANY FORMAT ODPOWIEDZI (JSON):",
            "Zwróć WYŁĄCZNIE listę obiektów JSON (Array) o strukturze:",
            (
                '[ {"id": 123, "text": "...", "is_closed": true, '
                '"difficulty": 1, "choices": ["...", "..."], '
                '"correct_choices": ["..."]} ]'
            ),
            "",
            "Wymagania i formatowanie:",
            cls.LATEX_RULES,
            cls.GENERAL_CONSTRAINTS,
            "",
        ]

        if instruction:
            parts.append(
                "### KRYTYCZNE INSTRUKCJE UŻYTKOWNIKA (NAJWYŻSZY PRIORYTET):\n"
                f"{instruction}\n"
                "Te instrukcje nadpisują wszelkie inne reguły generowania. "
                "Zastosuj się do nich w pierwszej kolejności.\n"
            )

        parts.append(
            f"Pytania do regeneracji (JSON):\n"
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
                "ZAMKNIĘTE (wyboru)."
            ),
            "Zasady:",
            "1. Stwórz 4 sensowne opcje wyboru (choices).",
            "2. Wskaż co najmniej jedną poprawną odpowiedź (correct_choices).",
            (
                "3. MOŻESZ lekko zmodyfikować pole 'text', aby pasowało do "
                "formatu pytania zamkniętego."
            ),
            "4. Zachowaj oryginalne 'id' i 'difficulty'.",
            (
                "5. UNIKAJ pytań o metodę rozwiązania lub teorię (np. 'Jak "
                "należy obliczyć...', 'Który wzór jest poprawny...')."
            ),
            (
                "6. ZAMIAST TEGO stwórz bezpośrednie pytanie o wynik, fakt lub "
                "informację. Opcje wyboru powinny być konkretnymi wartościami, "
                "nazwami lub odpowiedziami merytorycznymi."
            ),
            "",
            "### WYMAGANY FORMAT ODPOWIEDZI (JSON):",
            "Zwróć WYŁĄCZNIE listę obiektów JSON (Array) o strukturze:",
            (
                '[ {"id": 456, "text": "...", "is_closed": true, '
                '"difficulty": 2, "choices": ["...", "..."], '
                '"correct_choices": ["..."]} ]'
            ),
            "",
            "Wymagania i formatowanie:",
            cls.LATEX_RULES,
            cls.GENERAL_CONSTRAINTS,
            "",
            "Pytania do konwersji (JSON):\n"
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
                "(wyboru) w pytania OTWARTE."
            ),
            (
                "Otrzymasz treść pytania, opcje wyboru oraz poprawne "
                "odpowiedzi jako kontekst."
            ),
            "",
            "Zasady:",
            (
                "1. PRZEREDAGUJ treść pytania (field 'text') tak, aby było "
                "samodzielnym pytaniem otwartym."
            ),
            (
                "2. USUŃ wszelkie nawiązania do wyboru opcji (np. 'Która z "
                "podanych...', 'Z poniższych odpowiedzi...', 'Wskaż...')."
            ),
            (
                "3. WYKORZYSTAJ informacje z poprawnych odpowiedzi, aby "
                "pytanie było precyzyjne."
            ),
            "4. Zachowaj oryginalne 'id' i 'difficulty'.",
            "5. Pytanie musi być sformułowane tak, aby uczeń musiał "
            "samodzielnie sformułować odpowiedź.",
            "",
            "### WYMAGANY FORMAT ODPOWIEDZI (JSON):",
            "Zwróć WYŁĄCZNIE listę obiektów JSON (Array) o strukturze:",
            '[ {"id": 789, "text": "...", "difficulty": 1} ]',
            "",
            "Wymagania i formatowanie:",
            cls.LATEX_RULES,
            cls.GENERAL_CONSTRAINTS,
            "",
            "Pytania do konwersji z kontekstem (JSON):\n"
            f"{json.dumps(questions, ensure_ascii=False)}",
        ]
        return "\n".join(parts)
