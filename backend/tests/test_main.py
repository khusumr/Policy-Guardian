import sys
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

sys.path.append(str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from main import app
from document_parser import UnsupportedFileTypeError


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
    assert data["further_reading"] == []

    mock_generate.assert_called_once()


@patch("main.get_reference_links")
@patch("main.openai_service.generate_policy")
def test_generate_policy_includes_further_reading(mock_generate, mock_links):
    mock_generate.return_value = "Generated Security Policy"
    mock_links.return_value = [
        {
            "title": "HIPAA Security Rule",
            "url": "https://www.hhs.gov/hipaa/for-professionals/security/index.html",
            "source": "U.S. Department of Health & Human Services",
            "description": "Federal standards for protecting electronic personal health information.",
        }
    ]

    response = client.post(
        "/generate-policy",
        json={
            "company_name": "Quadrant Technologies",
            "policy_type": "Security Policy",
            "tone": "Professional",
            "requirements": [
                "Employees must use multi-factor authentication."
            ],
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data["further_reading"]) == 1
    assert data["further_reading"][0]["title"] == "HIPAA Security Rule"

    mock_links.assert_called_once_with("Security Policy")


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


def test_generate_policy_custom_section_without_title_returns_422():
    response = client.post(
        "/generate-policy",
        json={
            "company_name": "Quadrant Technologies",
            "policy_type": "Custom Section",
            "tone": "Professional",
            "requirements": ["No pets in the server room."],
        },
    )

    assert response.status_code == 422


@patch("main.openai_service.generate_policy")
def test_generate_policy_custom_section_with_title_succeeds(mock_generate):
    mock_generate.return_value = "Generated Office Pet Policy"

    response = client.post(
        "/generate-policy",
        json={
            "company_name": "Quadrant Technologies",
            "policy_type": "Custom Section",
            "title": "Office Pet Policy",
            "tone": "Professional",
            "requirements": ["No pets in the server room."],
        },
    )

    assert response.status_code == 200

    prompt_used = mock_generate.call_args[0][0]
    assert 'titled "Office Pet Policy"' in prompt_used


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


# --------------------------------------------------
# Policy Storage — POST /policies
# --------------------------------------------------

@patch("main.create_policy")
@patch("main.openai_service.generate_policy")
def test_save_policy_with_content_skips_generation(mock_generate, mock_create):
    mock_create.side_effect = lambda org_id, policy: policy

    response = client.post(
        "/policies?org_id=test-org",
        json={
            "company_name": "Quadrant Technologies",
            "policy_type": "Work From Home",
            "tone": "Professional",
            "requirements": ["Employees may work remotely twice per week."],
            "content": "This is the exact edited text from the frontend.",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["content"] == "This is the exact edited text from the frontend."
    assert data["further_reading"] == []
    mock_generate.assert_not_called()
    mock_create.assert_called_once()


@patch("main.create_policy")
@patch("main.get_reference_links")
def test_save_policy_attaches_further_reading(mock_links, mock_create):
    mock_links.return_value = [
        {
            "title": "Fair Labor Standards Act (FLSA) — Overtime Pay",
            "url": "https://www.dol.gov/agencies/whd/overtime",
            "source": "U.S. Department of Labor",
            "description": "Federal rules governing minimum wage and overtime pay eligibility.",
        }
    ]
    mock_create.side_effect = lambda org_id, policy: policy

    response = client.post(
        "/policies?org_id=test-org",
        json={
            "company_name": "Quadrant Technologies",
            "policy_type": "Attendance Policy",
            "tone": "Professional",
            "requirements": ["Employees must clock in by 9am."],
            "content": "Employees are expected to arrive on time.",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data["further_reading"]) == 1
    assert data["further_reading"][0]["source"] == "U.S. Department of Labor"

    mock_links.assert_called_once_with("Attendance Policy")


@patch("main.create_policy")
@patch("main.openai_service.generate_policy")
def test_save_policy_without_content_generates(mock_generate, mock_create):
    mock_generate.return_value = "Freshly generated policy text"
    mock_create.side_effect = lambda org_id, policy: policy

    response = client.post(
        "/policies?org_id=test-org",
        json={
            "company_name": "Quadrant Technologies",
            "policy_type": "Work From Home",
            "tone": "Professional",
            "requirements": ["Employees may work remotely twice per week."],
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["content"] == "Freshly generated policy text"
    mock_generate.assert_called_once()
    mock_create.assert_called_once()


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
# Policy Upload — POST /policies/{org_id}/upload
# --------------------------------------------------

@patch("main.create_policy")
@patch("main.extract_text_from_upload")
def test_upload_policy_success(mock_extract, mock_create):
    mock_extract.return_value = "Extracted policy text content."
    mock_create.side_effect = lambda org_id, policy: policy

    response = client.post(
        "/policies/test-org/upload",
        data={
            "company_name": "Quadrant Technologies",
            "policy_type": "Work From Home",
        },
        files={
            "file": (
                "existing-policy.docx",
                b"fake docx bytes",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["content"] == "Extracted policy text content."
    assert data["source"] == "uploaded"
    assert data["original_filename"] == "existing-policy.docx"

    mock_create.assert_called_once()


@patch("main.extract_text_from_upload")
def test_upload_policy_unsupported_type(mock_extract):
    mock_extract.side_effect = UnsupportedFileTypeError(
        "Unsupported file type for 'bad.exe'. Use .docx, .pdf, or .txt."
    )

    response = client.post(
        "/policies/test-org/upload",
        data={
            "company_name": "Quadrant Technologies",
            "policy_type": "Work From Home",
        },
        files={"file": ("bad.exe", b"junk", "application/octet-stream")},
    )

    assert response.status_code == 400
    assert "Unsupported file type" in response.json()["detail"]


@patch("main.extract_text_from_upload")
def test_upload_policy_empty_extracted_text(mock_extract):
    mock_extract.return_value = "   "

    response = client.post(
        "/policies/test-org/upload",
        data={
            "company_name": "Quadrant Technologies",
            "policy_type": "Work From Home",
        },
        files={"file": ("empty.txt", b"   ", "text/plain")},
    )

    assert response.status_code == 400
    assert response.json() == {
        "detail": "Could not extract any text from the uploaded file."
    }


# --------------------------------------------------
# Policy Edit — PATCH /policies/{org_id}/{policy_id}
# --------------------------------------------------

@patch("main.update_policy")
def test_edit_policy_success(mock_update):
    mock_update.return_value = {
        "id": "policy-1",
        "content": "Updated policy content here",
        "version": 2,
    }

    response = client.patch(
        "/policies/test-org/policy-1",
        json={"content": "Updated policy content here", "edited_by": "hr-user"},
    )

    assert response.status_code == 200

    data = response.json()

    assert data["version"] == 2

    mock_update.assert_called_once_with(
        "test-org",
        "policy-1",
        {"content": "Updated policy content here"},
        edited_by="hr-user",
    )


@patch("main.update_policy")
def test_edit_policy_not_found(mock_update):
    mock_update.return_value = None

    response = client.patch(
        "/policies/test-org/missing-policy",
        json={"content": "Updated policy content here"},
    )

    assert response.status_code == 404
    assert response.json() == {
        "detail": "Policy not found"
    }


def test_edit_policy_invalid_request():
    response = client.patch(
        "/policies/test-org/policy-1",
        json={"content": "short"},
    )

    assert response.status_code == 422


# --------------------------------------------------
# Policy History — GET /policies/{org_id}/{policy_id}/history
# --------------------------------------------------

@patch("main.get_policy_history")
def test_policy_history(mock_history):
    mock_history.return_value = [
        {"policy_id": "policy-1", "version": 1, "content": "old content"}
    ]

    response = client.get("/policies/test-org/policy-1/history")

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1
    assert data[0]["version"] == 1


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


@patch("main.policy_to_pdf_bytes")
@patch("main.get_policy")
def test_export_custom_section_uses_real_title_not_literal_type(
    mock_get_policy,
    mock_pdf,
):
    mock_get_policy.return_value = SimpleNamespace(
        company_name="Quadrant Technologies",
        policy_type="Custom Section",
        title="Office Pet Policy",
        content="No pets in the server room.",
    )

    mock_pdf.return_value = b"fake-pdf-content"

    client.get("/policies/test-org/policy-1/export/pdf")

    export_title = mock_pdf.call_args[0][1]
    assert export_title == "Quadrant Technologies Office Pet Policy"
    assert "Custom Section" not in export_title


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


# --------------------------------------------------
# Policy Upload — POST /policies/{org_id}/upload
# --------------------------------------------------

@patch("main.create_policy")
def test_upload_policy_txt_extracts_and_saves(mock_create):
    mock_create.side_effect = lambda org_id, policy: policy

    response = client.post(
        "/policies/test-org/upload",
        data={
            "company_name": "Quadrant Technologies",
            "policy_type": "Custom Section",
        },
        files={
            "file": ("handbook.txt", b"Employees may work remotely twice per week.", "text/plain"),
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["content"] == "Employees may work remotely twice per week."
    assert data["source"] == "uploaded"
    assert data["original_filename"] == "handbook.txt"
    mock_create.assert_called_once()


def test_upload_policy_unsupported_file_type():
    response = client.post(
        "/policies/test-org/upload",
        data={
            "company_name": "Quadrant Technologies",
            "policy_type": "Custom Section",
        },
        files={
            "file": ("handbook.exe", b"not a real policy", "application/octet-stream"),
        },
    )

    assert response.status_code == 400
    assert "Unsupported file type" in response.json()["detail"]


def test_upload_policy_empty_file():
    response = client.post(
        "/policies/test-org/upload",
        data={
            "company_name": "Quadrant Technologies",
            "policy_type": "Custom Section",
        },
        files={
            "file": ("empty.txt", b"   ", "text/plain"),
        },
    )

    assert response.status_code == 400
    assert "Could not extract any text" in response.json()["detail"]


# --------------------------------------------------
# Policy Edit — PATCH /policies/{org_id}/{policy_id}
# --------------------------------------------------

@patch("main.update_policy")
def test_edit_policy_success(mock_update):
    mock_update.return_value = SimpleNamespace(
        id="policy-1",
        content="Updated policy text goes here.",
        version=2,
    )

    response = client.patch(
        "/policies/test-org/policy-1",
        json={
            "content": "Updated policy text goes here.",
            "edited_by": "dana@bugbusters.io",
        },
    )

    assert response.status_code == 200
    mock_update.assert_called_once_with(
        "test-org",
        "policy-1",
        {"content": "Updated policy text goes here."},
        edited_by="dana@bugbusters.io",
    )


@patch("main.update_policy")
def test_edit_policy_not_found(mock_update):
    mock_update.return_value = None

    response = client.patch(
        "/policies/test-org/missing-policy",
        json={"content": "Updated policy text goes here."},
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Policy not found"}


def test_edit_policy_content_too_short():
    response = client.patch(
        "/policies/test-org/policy-1",
        json={"content": "short"},
    )

    assert response.status_code == 422


# --------------------------------------------------
# Policy History — GET /policies/{org_id}/{policy_id}/history
# --------------------------------------------------

@patch("main.get_policy_history")
def test_policy_history(mock_history):
    mock_history.return_value = [
        {"policy_id": "policy-1", "version": 1, "content": "First version"},
    ]

    response = client.get("/policies/test-org/policy-1/history")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["version"] == 1