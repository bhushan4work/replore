from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.database import supabase
from app.services.ai import ai_service
from app.services.rag import rag_service


router = APIRouter(
    prefix="/api/repositories",
)

class ChatRequest(BaseModel):
    question: str

@router.post("/{repository_id}/chat")
async def repository_chat(
    repository_id: str,
    request: ChatRequest,
):
    """
    Repository-aware AI chat using RAG.
    """

    repository = (
        supabase.table("repositories")
        .select("*")
        .eq("id", request.repository_id)
        .single()
        .execute()
    )

    if repository.data is None:
        raise HTTPException(
            status_code=404,
            detail="Repository not found.",
        )

    context = rag_service.search(
        request.repository_id,
        request.question,
    )

    if not context:

        return {
            "answer": "I couldn't find any relevant context inside this repository for your question."
        }

    answer = ai_service.chat(
        question=request.question,
        context=context,
    )

    return {
        "repository_id": request.repository_id,
        "question": request.question,
        "answer": answer,
    }