import sys
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

sys.path.append(str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from main import app


client = TestClient(app)


def test_home():
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {
        "message": "Backend is working!"
    }


@patch("main.openai_service.generate_policy")
def test_generate_policy_valid_request(mock_generate):
    mock_generate.return_value = "Generated Work From Home Policy"

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
    assert data["policy"] == "Generated Work From Home Policy"

    mock_generate.assert_called_once()


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


def test_generate_policy_blank_company_name():
    response = client.post(
        "/generate-policy",
        json={
            "company_name": "   ",
            "policy_type": "Work From Home",
            "tone": "Professional",
            "requirements": [
                "Employees may work remotely."
            ],
        },
    )

    assert response.status_code == 422


def test_generate_policy_empty_requirement():
    response = client.post(
        "/generate-policy",
        json={
            "company_name": "Quadrant Technologies",
            "policy_type": "Work From Home",
            "tone": "Professional",
            "requirements": [
                "   "
            ],
        },
    )

    assert response.status_code == 422


@patch("main.openai_service.generate_policy")
def test_refine_policy_valid_request(mock_generate):
    mock_generate.return_value = "Refined professional policy"

    response = client.post(
        "/refine-policy",
        json={
            "current_policy": (
                "Employees may work remotely two days each week "
                "with manager approval."
            ),
            "instruction": (
                "Make the policy more professional."
            ),
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert "policy" in data
    assert data["policy"] == "Refined professional policy"

    mock_generate.assert_called_once()


def test_refine_policy_invalid_request():
    response = client.post(
        "/refine-policy",
        json={
            "current_policy": "Too short",
            "instruction": "Hi",
        },
    )

    assert response.status_code == 422


@patch("main.openai_service.generate_policy")
def test_generate_policy_openai_failure(mock_generate):
    mock_generate.side_effect = Exception("Azure OpenAI unavailable")

    response = client.post(
        "/generate-policy",
        json={
            "company_name": "Quadrant Technologies",
            "policy_type": "Work From Home",
            "tone": "Professional",
            "requirements": [
                "Employees may work remotely."
            ],
        },
    )

    assert response.status_code == 500
    assert response.json() == {
        "detail": "Failed to generate policy. Please try again."
    }


@patch("main.openai_service.generate_policy")
def test_refine_policy_openai_failure(mock_generate):
    mock_generate.side_effect = Exception("Azure OpenAI unavailable")

    response = client.post(
        "/refine-policy",
        json={
            "current_policy": (
                "Employees may work remotely two days each week "
                "with manager approval."
            ),
            "instruction": (
                "Make the policy more professional."
            ),
        },
    )

    assert response.status_code == 500
    assert response.json() == {
        "detail": "Failed to refine policy. Please try again."
    }


@patch("main.get_policy")
def test_fetch_policy_not_found(mock_get_policy):
    mock_get_policy.return_value = None

    response = client.get(
        "/policies/test-org/missing-policy"
    )

    assert response.status_code == 404
    assert response.json() == {
        "detail": "Policy not found"
    }


@patch("main.list_policies")
def test_fetch_all_policies(mock_list_policies):
    mock_list_policies.return_value = [
        {
            "id": "policy-1",
            "company_name": "Quadrant Technologies",
        }
    ]

    response = client.get(
        "/policies/test-org"
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1
    assert data[0]["company_name"] == "Quadrant Technologies"


# --------------------------------------------------
# Export Tests
# --------------------------------------------------

@patch("main.policy_to_pdf_bytes")
@patch("main.get_policy")
def test_export_policy_pdf(
    mock_get_policy,
    mock_pdf,
):
    mock_get_policy.return_value = SimpleNamespace(
        company_name="Quadrant Technologies",
        policy_type="Work From Home",
        content="Employees may work remotely.",
    )

    mock_pdf.return_value = b"fake-pdf-content"

    response = client.get(
        "/policies/test-org/policy-1/export/pdf"
    )

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"

    assert (
        'attachment; filename="policy-1.pdf"'
        in response.headers["content-disposition"]
    )

    assert response.content == b"fake-pdf-content"

    mock_pdf.assert_called_once()


@patch("main.policy_to_docx_bytes")
@patch("main.get_policy")
def test_export_policy_docx(
    mock_get_policy,
    mock_docx,
):
    mock_get_policy.return_value = SimpleNamespace(
        company_name="Quadrant Technologies",
        policy_type="Work From Home",
        content="Employees may work remotely.",
    )

    mock_docx.return_value = b"fake-docx-content"

    response = client.get(
        "/policies/test-org/policy-1/export/docx"
    )

    assert response.status_code == 200

    assert (
        response.headers["content-type"]
        == (
            "application/vnd.openxmlformats-officedocument."
            "wordprocessingml.document"
        )
    )

    assert (
        'attachment; filename="policy-1.docx"'
        in response.headers["content-disposition"]
    )

    assert response.content == b"fake-docx-content"

    mock_docx.assert_called_once()


@patch("main.get_policy")
def test_export_pdf_policy_not_found(mock_get_policy):
    mock_get_policy.return_value = None

    response = client.get(
        "/policies/test-org/missing-policy/export/pdf"
    )

    assert response.status_code == 404
    assert response.json() == {
        "detail": "Policy not found"
    }


@patch("main.get_policy")
def test_export_docx_policy_not_found(mock_get_policy):
    mock_get_policy.return_value = None

    response = client.get(
        "/policies/test-org/missing-policy/export/docx"
    )

    assert response.status_code == 404
    assert response.json() == {
        "detail": "Policy not found"
    }