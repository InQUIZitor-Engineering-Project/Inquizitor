import json
from typing import List, Dict

from google import genai
from app.core.config import settings
from app.schemas.test import GenerateParams

_client = genai.Client(api_key=settings.GEMINI_API_KEY)


def _build_prompt(text: str, p: GenerateParams) -> str:
    base = [
        f"Na podstawie tekstu:\n{text}\n\n"
        f"Stwórz {p.num_closed} pytania zamknięte i {p.num_open} pytania otwarte."
    ]

    if p.closed_types:
        closed_types_str = ", ".join(p.closed_types)
        base.append(f"Dla pytań zamkniętych użyj tylko typów: {closed_types_str}")

    base.append(
        f"Poziomy trudności rozdaj tak: {p.easy} łatwych, {p.medium} średnich, {p.hard} trudnych."
    )

    base.append(
        """\nKażde pytanie wypisz jako JSON-owy obiekt ze strukturą:
{
  "text": "...",
  "is_closed": true lub false,
  "difficulty": 1|2|3,
  "choices": [..] lub null,
  "correct_choices": [..] lub null
}
Zwróć WYŁĄCZNIE listę takich obiektów w JSON (bez dodatkowego tekstu).
"""
    )

    return "\n\n".join(base)




def generate_questions_from_text(text: str, params: GenerateParams) -> List[Dict]:
    """
    Korzysta z Google GenAI SDK do wysłania promptu i otrzymania JSON-a z pytaniami.
    Synchronizuje wywołanie, a jeśli coś pójdzie nie tak, rzuca wyjątek.
    """
    prompt = _build_prompt(text, params)

    response = _client.models.generate_content(
        model="gemini-2.0-flash", 
        contents=prompt
    )

    raw_output = response.text  
    if raw_output.startswith("```"):
        raw_output = raw_output.strip("`")  
    if raw_output.startswith("json"):
        raw_output = raw_output[4:].strip() 

    try:
        questions_list = json.loads(raw_output)
    except json.JSONDecodeError:
        raise ValueError(f"Nie udało się sparsować odpowiedzi Gemini jako JSON:\n{raw_output}")

    normalized_questions: List[Dict] = []
    for q in questions_list:
        if not all(key in q for key in ("text", "is_closed", "difficulty", "choices", "correct_choices")):
            raise ValueError(f"Brakuje pola w wygenerowanym pytaniu: {q}")

        choices_field = q["choices"]
        correct_field = q["correct_choices"]

        normalized_questions.append({
            "text": q["text"],
            "is_closed": bool(q["is_closed"]),
            "difficulty": int(q["difficulty"]),
            "choices": json.dumps(choices_field) if isinstance(choices_field, list) else None,
            "correct_choices": json.dumps(correct_field) if isinstance(correct_field, list) else None
        })

    return normalized_questions
