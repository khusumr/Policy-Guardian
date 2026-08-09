from fastapi.testclient import TestClient

import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_home():
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {"message": "Backend is working!"}


def test_generate_policy_valid_request():
    response = client.post(
        "/generate-policy",
        json={
            "company_name": "Quadrant Technologies",
            "policy_type": "Work From Home",
            "tone": "Professional",
            "requirements": [
                "Employees may work remotely twice per week."
            ],
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert "policy" in data
    assert "Azure OpenAI Placeholder" in data["policy"]


def test_generate_policy_invalid_request():
    response = client.post(
        "/generate-policy",
        json={
            "company_name": "Q",
            "policy_type": "Pizza",
            "tone": "Casual",
            "requirements": [],
        },
    )

    assert response.status_code == 422