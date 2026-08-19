import jwt
from fastapi import Depends, HTTPException, Request
from jwt import PyJWKClient

from settings import ENTRA_TENANT_ID, ENTRA_CLIENT_ID
from logger import get_logger

logger = get_logger(__name__)

JWKS_URL = f"https://login.microsoftonline.com/{ENTRA_TENANT_ID}/discovery/v2.0/keys"
ISSUER = f"https://login.microsoftonline.com/{ENTRA_TENANT_ID}/v2.0"

# PyJWKClient caches fetched signing keys by kid internally, so this one
# client instance (not re-created per request) avoids hitting Microsoft's
# JWKS endpoint on every single API call.
_jwks_client: PyJWKClient | None = None


def _get_jwks_client() -> PyJWKClient:
    global _jwks_client

    if _jwks_client is None:
        _jwks_client = PyJWKClient(JWKS_URL)

    return _jwks_client


class CurrentUser:
    def __init__(self, claims: dict):
        self.claims = claims
        self.roles: list[str] = claims.get("roles", [])
        self.name = claims.get("name") or claims.get("preferred_username")
        self.object_id = claims.get("oid")

    def has_role(self, role: str) -> bool:
        return role in self.roles


def get_current_user(request: Request) -> CurrentUser:
    """FastAPI dependency: validates the Authorization header's bearer
    token against Entra ID's public signing keys and returns the caller's
    identity + roles. Raises 401 on anything wrong with the token itself
    (missing, expired, bad signature, wrong audience/issuer) — never lets
    an invalid token through as an anonymous/degraded request.
    """
    auth_header = request.headers.get("Authorization", "")

    if not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Missing or invalid Authorization header. Expected 'Bearer <token>'.",
        )

    token = auth_header.removeprefix("Bearer ").strip()

    try:
        signing_key = _get_jwks_client().get_signing_key_from_jwt(token)

        claims = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            audience=ENTRA_CLIENT_ID,
            issuer=ISSUER,
        )

    except jwt.PyJWTError as exc:
        logger.warning(f"Token validation failed: {exc}")

        raise HTTPException(status_code=401, detail=f"Invalid token: {exc}")

    return CurrentUser(claims)


def require_role(*allowed_roles: str):
    """Dependency factory: Depends(require_role("HR", "Manager")) blocks
    the request with 403 unless the caller's token has at least one of the
    listed roles. Composes with get_current_user rather than duplicating
    its validation.
    """

    def dependency(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if not any(user.has_role(role) for role in allowed_roles):
            raise HTTPException(
                status_code=403,
                detail=f"Requires one of roles: {', '.join(allowed_roles)}.",
            )

        return user

    return dependency
