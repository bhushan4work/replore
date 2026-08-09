from __future__ import annotations

from groq import Groq

from app.config import settings


SYSTEM_PROMPT = """
You are replore AI.

You help developers understand GitHub repositories.

Rules:

- Answer ONLY from the provided repository context.
- If the answer cannot be determined, say so.
- Explain architecture clearly.
- Explain functions, classes and files.
- Keep responses concise but technically accurate.
"""


class AIService:

    def __init__(self) -> None:

        self.client = Groq(
            api_key=settings.GROQ_API_KEY,
        )

    # ---------------------------------------------------------

    def chat(
        self,
        question: str,
        context: str,
        model: str = "llama-3.3-70b-versatile",
    ) -> str:

        messages = [
            {
                "role": "system",
                "content": SYSTEM_PROMPT,
            },
            {
                "role": "user",
                "content": f"""
Repository Context:

{context}

-------------------------

Question:

{question}
""",
            },
        ]

        response = self.client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.2,
        )

        return response.choices[0].message.content


ai_service = AIService()