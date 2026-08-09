# from fastapi import APIRouter
# from pydantic import BaseModel

# router = APIRouter()


# class LoginRequest(BaseModel):
#     access_token: str


# @router.get("/health")
# async def auth_health():
#     """
#     Authentication service health check.
#     """

#     return {
#         "status": "ok",
#         "provider": "Supabase Auth",
#     }


# @router.post("/verify")
# async def verify_session(request: LoginRequest):
#     """
#     Placeholder endpoint.

#     Frontend will authenticate using Supabase Auth.
#     The backend will later verify the JWT and return
#     the authenticated user.
#     """

#     return {
#         "authenticated": True,
#         "message": "JWT verification will be implemented during Supabase Auth integration.",
#         "token_preview": request.access_token[:20] + "...",
#     }







from fastapi import APIRouter, Depends, Header, HTTPException
from supabase import Client

from app.database import supabase

router = APIRouter()


def get_supabase() -> Client:
    return supabase


@router.get("/health")
async def auth_health():
    """
    Authentication service health check.
    """

    return {
        "status": "ok",
        "provider": "Supabase Auth",
    }


@router.get("/me")
async def get_current_user(
    authorization: str | None = Header(default=None),
    supabase_client: Client = Depends(get_supabase),
):
    """
    Returns the currently authenticated user.

    Expects:

    Authorization: Bearer <access_token>
    """

    if authorization is None:
        raise HTTPException(
            status_code=401,
            detail="Authorization header missing.",
        )

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header.",
        )

    access_token = authorization.replace(
        "Bearer ",
        "",
    )

    try:

        response = supabase_client.auth.get_user(
            access_token,
        )

    except Exception:

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token.",
        )

    if response.user is None:

        raise HTTPException(
            status_code=401,
            detail="User not found.",
        )

    user = response.user

    return {
        "id": user.id,
        "email": user.email,
        "name": (
            user.user_metadata.get("full_name")
            if user.user_metadata
            else None
        ),
        "avatar": (
            user.user_metadata.get("avatar_url")
            if user.user_metadata
            else None
        ),
        "provider": (
            user.app_metadata.get("provider")
            if user.app_metadata
            else None
        ),
    }

    