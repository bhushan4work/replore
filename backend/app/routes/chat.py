import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.database import supabase
from app.services.ai import ai_service
from app.services.rag import rag_service

logger = logging.getLogger(__name__)

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
        .eq("id", repository_id)
        .single()
        .execute()
    )

    if repository.data is None:
        raise HTTPException(
            status_code=404,
            detail="Repository not found.",
        )

    try:

        chunks = rag_service.retrieve(
            repository_id,
            request.question,
        )

    except Exception as exc:

        logger.exception(
            "RAG retrieval failed for repository %s.",
            repository_id,
        )

        return {
            "repository_id": repository_id,
            "question": request.question,
            "answer": (
                "I couldn't retrieve repository context right now. "
                "Please try again."
            ),
        }

    context = rag_service.build_context(chunks)

    if not context:

        return {
            "repository_id": repository_id,
            "question": request.question,
            "answer": (
                "I couldn't find relevant information in this repository "
                "for your question. The repository may not provide enough "
                "information to answer it."
            ),
        }

    try:

        answer = ai_service.chat(
            question=request.question,
            context=context,
        )

    except Exception as exc:

        logger.exception(
            "LLM chat failed for repository %s.",
            repository_id,
        )

        return {
            "repository_id": repository_id,
            "question": request.question,
            "answer": (
                "I'm having trouble reaching the language model right now. "
                "Please try again."
            ),
        }

    return {
        "repository_id": repository_id,
        "question": request.question,
        "answer": answer,
    }