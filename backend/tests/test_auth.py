import sys
import time
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

sys.path.append(str(Path(__file__).resolve().parent.parent))

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

import auth
from auth import get_current_user, require_role, CurrentUser
from settings import ENTRA_CLIENT_ID, ENTRA_TENANT_ID

# A throwaway RSA keypair used only to sign test tokens — validates the
# real signature-checking code path without calling Microsoft's actual
# JWKS endpoint.
_PRIVATE_KEY = rsa.generate_private_key(public_exponent=65537, key_size=2048)
_PUBLIC_KEY = _PRIVATE_KEY.public_key()

ISSUER = f"https://login.microsoftonline.com/{ENTRA_TENANT_ID}/v2.0"


def _make_token(roles=None, audience=ENTRA_CLIENT_ID, issuer=ISSUER, expired=False):
    now = int(time.time())

    claims = {
        "aud": audience,
        "iss": issuer,
        "iat": now,
        "exp": now - 10 if expired else now + 3600,
        "oid": "test-object-id",
        "name": "Test User",
        "roles": roles or [],
    }

    return jwt.encode(claims, _PRIVATE_KEY, algorithm="RS256")


@pytest.fixture(autouse=True)
def mock_jwks_client():
    fake_signing_key = SimpleNamespace(key=_PUBLIC_KEY)
    fake_client = SimpleNamespace(
        get_signing_key_from_jwt=lambda token: fake_signing_key
    )

    with patch.object(auth, "_jwks_client", fake_client):
        yield


# --------------------------------------------------
# get_current_user
# --------------------------------------------------

def _build_test_app():
    app = FastAPI()

    @app.get("/whoami")
    def whoami(user: CurrentUser = Depends(get_current_user)):
        return {"name": user.name, "roles": user.roles}

    @app.get("/hr-only")
    def hr_only(user: CurrentUser = Depends(require_role("HR"))):
        return {"name": user.name}

    return app


client = TestClient(_build_test_app())


def test_valid_token_returns_claims():
    token = _make_token(roles=["Manager"])

    response = client.get("/whoami", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    assert response.json() == {"name": "Test User", "roles": ["Manager"]}


def test_missing_header_returns_401():
    response = client.get("/whoami")

    assert response.status_code == 401


def test_malformed_header_returns_401():
    response = client.get("/whoami", headers={"Authorization": "NotBearer abc"})

    assert response.status_code == 401


def test_expired_token_returns_401():
    token = _make_token(roles=["HR"], expired=True)

    response = client.get("/whoami", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 401


def test_wrong_audience_returns_401():
    token = _make_token(roles=["HR"], audience="some-other-app-id")

    response = client.get("/whoami", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 401


def test_wrong_issuer_returns_401():
    token = _make_token(roles=["HR"], issuer="https://login.microsoftonline.com/wrong-tenant/v2.0")

    response = client.get("/whoami", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 401


# --------------------------------------------------
# require_role
# --------------------------------------------------

def test_require_role_allows_matching_role():
    token = _make_token(roles=["HR"])

    response = client.get("/hr-only", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200


def test_require_role_blocks_non_matching_role():
    token = _make_token(roles=["Intern"])

    response = client.get("/hr-only", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 403


def test_require_role_blocks_no_roles():
    token = _make_token(roles=[])

    response = client.get("/hr-only", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 403
