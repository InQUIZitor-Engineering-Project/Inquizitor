from __future__ import annotations

import json
from typing import Any, Dict, List


class PromptBuilder:
    """
    Centralized utility for building consistent prompts for LLM.
    Ensures persona, formatting (LaTeX), and constraints are shared across all features.
    """

    PERSONA = "Pracujesz jako polski ekspert dydaktyczny i pedagogiczny."
    
    LATEX_RULES = (
        "- Jeśli w treści pytania lub odpowiedzi pojawia się zapis matematyczny (wzór, równanie, wyrażenie), zapisuj go w składni LaTeX.\n"
        '- Dla matematyki w tekście używaj WYŁĄCZNIE formatu "$...$", np.: `"text": "Ile wynosi $x^2 + y^2$?"`.\n'
        '- Dla osobnych wzorów możesz użyć `$$...$$`, np.: `"text": "Podaj wynik: $$\\int_0^1 x^2\\,dx$$"`.\n'
        "- Nie używaj innych notacji (takich jak \\( ... \\), \\[ ... \\], HTML, Markdown).\n"
        "- Upewnij się, że wszystkie backslash'e w LaTeX są poprawnie zapisane w JSON (np. \"$\\frac{1}{2}$\")."
    )

    GENERAL_CONSTRAINTS = (
        "- Każde pytanie i wszystkie odpowiedzi muszą być w języku polskim.\n"
        "- NIE numeruj treści pytań ani odpowiedzi: nie dodawaj prefiksów typu '1.', 'Pytanie 1', '-', '•' ani innych numerów w polach `text` i `choices`.\n"
        "- Wszystkie pytania muszą wynikać z tekstu źródłowego; nie wymyślaj danych ani nazw własnych.\n"
        "- Preferuj pytania sprawdzające zrozumienie pojęć, relacji, wnioskowania niż czyste zapamiętywanie faktów."
    )

    @classmethod
    def build_full_test_prompt(cls, text: str, params: Any) -> str:
        """Prompt for generating a complete new test."""
        c_total = params.closed.true_false + params.closed.single_choice + params.closed.multi_choice
        
        parts = [
            cls.PERSONA,
            f"Twoim zadaniem jest przygotowanie testu ({c_total} pytań zamkniętych, {params.num_open} pytań otwartych) na podstawie materiału.",
            f"Rozkład trudności: {params.easy} łatwych, {params.medium} średnich, {params.hard} trudnych.",
            "",
            "### WYMAGANY FORMAT ODPOWIEDZI (JSON):",
            "Zwróć WYŁĄCZNIE poprawny obiekt JSON o następującej strukturze:",
            "{",
            '  "title": "Krótki tytuł testu po polsku",',
            '  "questions": [',
            '    {',
            '      "text": "Treść pytania",',
            '      "is_closed": true,',
            '      "difficulty": 1,',
            '      "choices": ["Opcja A", "Opcja B", "Opcja C", "Opcja D"],',
            '      "correct_choices": ["Opcja A"]',
            '    },',
            '    { "text": "Treść pytania otwartego", "is_closed": false, "difficulty": 2, "choices": null, "correct_choices": null }',
            '  ]',
            "}",
            "",
            "Wymagania i formatowanie:",
            cls.LATEX_RULES,
            cls.GENERAL_CONSTRAINTS,
            "",
            f"Tekst źródłowy:\n{text}"
        ]
        
        if params.additional_instructions:
            parts.insert(3, f"Dodatkowe instrukcje (PRIORYTET): {params.additional_instructions}")
            
        return "\n".join(parts)

    @classmethod
    def build_regeneration_prompt(cls, questions: List[Dict], instruction: str | None = None) -> str:
        """Prompt for regenerating existing questions."""
        parts = [
            cls.PERSONA,
            "Twoim zadaniem jest wygenerowanie nowych wariantów dla poniższych pytań.",
            "Zasady:",
            "- Zachowaj oryginalne 'id', 'is_closed' oraz 'difficulty' dla każdego pytania.",
            "- Zmień treść pytania i opcje tak, aby sprawdzały tę samą wiedzę, ale w nowy sposób (np. inne dane liczbowe, inne przykłady).",
            "- BĄDŹ CZUJNY NA BŁĘDY: Jeśli w wejściowym pytaniu widzisz błąd merytoryczny, językowy lub logiczny, NAPRAW GO w nowym wariancie.",
            "- Nowe pytania muszą być bezbłędne, jasne i dydaktycznie wartościowe.",
            "",
            "### WYMAGANY FORMAT ODPOWIEDZI (JSON):",
            "Zwróć WYŁĄCZNIE listę obiektów JSON (Array) o strukturze jak wejście, np.:",
            '[ {"id": 123, "text": "Nowa treść", "is_closed": true, "difficulty": 1, "choices": ["...", "..."], "correct_choices": ["..."]} ]',
            "",
            "Wymagania i formatowanie:",
            cls.LATEX_RULES,
            cls.GENERAL_CONSTRAINTS,
            "",
        ]
        
        if instruction:
            parts.append(f"SKUP SIĘ NA (INSTRUKCJA UŻYTKOWNIKA): {instruction}\n")
            
        parts.append(f"Pytania do regeneracji (JSON):\n{json.dumps(questions, ensure_ascii=False)}")
        return "\n".join(parts)

    @classmethod
    def build_conversion_prompt(cls, questions: List[Dict]) -> str:
        """Prompt for converting open questions to closed ones."""
        parts = [
            cls.PERSONA,
            "Twoim zadaniem jest przekształcenie pytań OTWARTYCH w pytania ZAMKNIĘTE (wyboru).",
            "Zasady:",
            "1. Stwórz 4 sensowne opcje wyboru (choices).",
            "2. Wskaż co najmniej jedną poprawną odpowiedź (correct_choices).",
            "3. MOŻESZ lekko zmodyfikować pole 'text', aby pasowało do formatu pytania zamkniętego.",
            "4. Zachowaj oryginalne 'id' i 'difficulty'.",
            "5. UNIKAJ pytań o metodę rozwiązania lub teorię (np. 'Jak należy obliczyć...', 'Który wzór jest poprawny...').",
            "6. ZAMIAST TEGO stwórz bezpośrednie pytanie o wynik, fakt lub informację. Opcje wyboru powinny być konkretnymi wartościami, nazwami lub odpowiedziami merytorycznymi.",
            "",
            "### WYMAGANY FORMAT ODPOWIEDZI (JSON):",
            "Zwróć WYŁĄCZNIE listę obiektów JSON (Array) o następującej strukturze:",
            '[ {"id": 456, "text": "Ile wynosi suma x i y?", "is_closed": true, "difficulty": 2, "choices": ["10", "15", "20", "25"], "correct_choices": ["20"]} ]',
            "",
            "Wymagania i formatowanie:",
            cls.LATEX_RULES,
            cls.GENERAL_CONSTRAINTS,
            "",
            f"Pytania do konwersji (JSON):\n{json.dumps(questions, ensure_ascii=False)}"
        ]
        return "\n".join(parts)

    @classmethod
    def build_closed_to_open_prompt(cls, questions: List[Dict]) -> str:
        """Prompt for converting closed questions back to open ones, using their context."""
        parts = [
            cls.PERSONA,
            "Twoim zadaniem jest przekształcenie pytań ZAMKNIĘTYCH (wyboru) w pytania OTWARTE.",
            "Otrzymasz treść pytania, opcje wyboru oraz poprawne odpowiedzi jako kontekst.",
            "",
            "Zasady:",
            "1. PRZEREDAGUJ treść pytania (field 'text') tak, aby było samodzielnym pytaniem otwartym.",
            "2. USUŃ wszelkie nawiązania do wyboru opcji (np. 'Która z podanych...', 'Z poniższych odpowiedzi...', 'Wskaż...').",
            "3. WYKORZYSTAJ informacje z poprawnych odpowiedzi, aby pytanie było precyzyjne.",
            "4. Zachowaj oryginalne 'id' i 'difficulty'.",
            "5. Pytanie musi być sformułowane tak, aby uczeń musiał samodzielnie sformułować odpowiedź.",
            "",
            "### WYMAGANY FORMAT ODPOWIEDZI (JSON):",
            "Zwróć WYŁĄCZNIE listę obiektów JSON (Array) o strukturze:",
            '[ {"id": 789, "text": "Wyjaśnij pojęcie fotosyntezy.", "difficulty": 1} ]',
            "",
            "Wymagania i formatowanie:",
            cls.LATEX_RULES,
            cls.GENERAL_CONSTRAINTS,
            "",
            f"Pytania do konwersji z kontekstem (JSON):\n{json.dumps(questions, ensure_ascii=False)}"
        ]
        return "\n".join(parts)
