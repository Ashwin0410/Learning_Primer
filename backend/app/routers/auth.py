"""Minimal single-learner auth: one shared passcode, returned as a bearer token."""
from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException, status

from ..config import get_settings
from ..schemas import LoginRequest, LoginResponse

router = APIRouter(tags=["auth"])
settings = get_settings()


@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest) -> LoginResponse:
    if body.passcode.strip() != settings.primer_passcode:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect passcode")
    # The token is simply the passcode — fine for a personal single-learner app.
    return LoginResponse(ok=True, learner_name=settings.learner_name, token=settings.primer_passcode)


def require_auth(authorization: str | None = Header(default=None)) -> None:
    """Dependency that enforces the bearer token equals the passcode."""
    token = ""
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
    if token != settings.primer_passcode:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
