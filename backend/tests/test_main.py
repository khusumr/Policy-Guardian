import sys
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

sys.path.append(str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from main import app
from document_parser import UnsupportedFileTypeError
from auth import get_current_user, CurrentUser


def _fake_user(roles=("HR",)):
    return CurrentUser({"name": "Test User", "roles": list(roles), "oid": "test-oid"})


# Everything below predates role-based auth and is testing endpoint
# behavior, not the auth layer itself (that's covered in test_auth.py and
# the dedicated tests at the bottom of this file) — default to an HR user
# so existing tests don't all have to individually mock a bearer token.
app.dependency_overrides[get_current_user] = lambda: _fake_user()

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
def test_policy_chat_returns_follow_up_question(mock_generate):
    mock_generate.return_value = "Who does this policy apply to?"

    response = client.post(
        "/policy-chat",
        json={
            "messages": [
                {"role": "user", "text": "I want a policy about pets in the office."}
            ]
        },
    )

    assert response.status_code == 200
    assert response.json() == {"reply": "Who does this policy apply to?"}

    mock_generate.assert_called_once()


@patch("main.openai_service.generate_policy")
def test_policy_chat_can_signal_ready(mock_generate):
    mock_generate.return_value = "READY"

    response = client.post(
        "/policy-chat",
        json={
            "messages": [
                {"role": "user", "text": "Pets are allowed for all full-time staff."},
                {"role": "assistant", "text": "Any exceptions?"},
                {"role": "user", "text": "No exceptions."},
            ]
        },
    )

    assert response.status_code == 200
    assert response.json() == {"reply": "READY"}


def test_policy_chat_empty_messages_returns_422():
    response = client.post("/policy-chat", json={"messages": []})

    assert response.status_code == 422


@patch("main.openai_service.generate_policy")
def test_policy_chat_openai_failure(mock_generate):
    mock_generate.side_effect = Exception("Azure OpenAI unavailable")

    response = client.post(
        "/policy-chat",
        json={"messages": [{"role": "user", "text": "A policy about pets."}]},
    )

    assert response.status_code == 500
    assert response.json() == {
        "detail": "Failed to get a response. Please try again."
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


# --------------------------------------------------
# Role enforcement — confirms the actual endpoints have the right
# dependency attached, not just that auth.py's logic works in isolation
# (see test_auth.py for that). Temporarily overrides the module-level
# HR-user default set above.
# --------------------------------------------------

def test_generate_policy_requires_authentication():
    app.dependency_overrides.pop(get_current_user, None)

    try:
        response = client.post(
            "/generate-policy",
            json={
                "company_name": "Quadrant Technologies",
                "policy_type": "Work From Home",
                "tone": "Professional",
                "requirements": ["Employees may work remotely."],
            },
        )

        assert response.status_code == 401
    finally:
        app.dependency_overrides[get_current_user] = lambda: _fake_user()


def test_generate_policy_blocks_non_hr_role():
    app.dependency_overrides[get_current_user] = lambda: _fake_user(roles=["Intern"])

    try:
        response = client.post(
            "/generate-policy",
            json={
                "company_name": "Quadrant Technologies",
                "policy_type": "Work From Home",
                "tone": "Professional",
                "requirements": ["Employees may work remotely."],
            },
        )

        assert response.status_code == 403
    finally:
        app.dependency_overrides[get_current_user] = lambda: _fake_user()


@patch("main.list_policies")
def test_fetch_all_policies_allows_non_hr_role(mock_list_policies):
    mock_list_policies.return_value = []
    app.dependency_overrides[get_current_user] = lambda: _fake_user(roles=["Intern"])

    try:
        response = client.get("/policies/test-org")

        assert response.status_code == 200
    finally:
        app.dependency_overrides[get_current_user] = lambda: _fake_user()


@patch("main.update_policy")
def test_edit_policy_blocks_non_hr_role(mock_update):
    app.dependency_overrides[get_current_user] = lambda: _fake_user(roles=["Manager"])

    try:
        response = client.patch(
            "/policies/test-org/policy-1",
            json={"content": "Updated policy content here"},
        )

        assert response.status_code == 403
        mock_update.assert_not_called()
    finally:
        app.dependency_overrides[get_current_user] = lambda: _fake_user()


# --------------------------------------------------
# Policy Signatures
# --------------------------------------------------

@patch("main.sign_policy")
@patch("main.get_policy")
def test_sign_policy_success(mock_get_policy, mock_sign):
    mock_get_policy.return_value = SimpleNamespace(id="policy-1")
    mock_sign.return_value = {
        "policy_id": "policy-1",
        "signer_user_id": "test-oid",
        "signer_roles": ["HR"],
        "signed_name": "Jane Doe",
    }

    response = client.post(
        "/policies/test-org/policy-1/sign",
        json={"signed_name": "Jane Doe"},
    )

    assert response.status_code == 200
    assert response.json()["signed_name"] == "Jane Doe"

    mock_sign.assert_called_once_with(
        "test-org",
        "policy-1",
        signer_user_id="test-oid",
        signer_roles=["HR"],
        signed_name="Jane Doe",
    )


@patch("main.get_policy")
def test_sign_policy_not_found(mock_get_policy):
    mock_get_policy.return_value = None

    response = client.post(
        "/policies/test-org/missing-policy/sign",
        json={"signed_name": "Jane Doe"},
    )

    assert response.status_code == 404


def test_sign_policy_blank_name_returns_422():
    response = client.post(
        "/policies/test-org/policy-1/sign",
        json={"signed_name": "  "},
    )

    assert response.status_code == 422


def test_sign_policy_requires_authentication():
    app.dependency_overrides.pop(get_current_user, None)

    try:
        response = client.post(
            "/policies/test-org/policy-1/sign",
            json={"signed_name": "Jane Doe"},
        )

        assert response.status_code == 401
    finally:
        app.dependency_overrides[get_current_user] = lambda: _fake_user()


@patch("main.get_signature")
def test_signed_by_me_true(mock_get_signature):
    mock_get_signature.return_value = {
        "policy_id": "policy-1",
        "signer_user_id": "test-oid",
        "signed_name": "Jane Doe",
    }

    response = client.get("/policies/test-org/policy-1/signed-by-me")

    assert response.status_code == 200
    assert response.json()["signed"] is True


@patch("main.get_signature")
def test_signed_by_me_false(mock_get_signature):
    mock_get_signature.return_value = None

    response = client.get("/policies/test-org/policy-1/signed-by-me")

    assert response.status_code == 200
    assert response.json()["signed"] is False


@patch("main.list_signatures")
def test_policy_signatures_allows_hr_and_manager(mock_list_signatures):
    mock_list_signatures.return_value = []

    for role in ("HR", "Manager"):
        app.dependency_overrides[get_current_user] = lambda role=role: _fake_user(roles=[role])
        response = client.get("/policies/test-org/policy-1/signatures")
        assert response.status_code == 200

    app.dependency_overrides[get_current_user] = lambda: _fake_user()


def test_policy_signatures_blocks_intern():
    app.dependency_overrides[get_current_user] = lambda: _fake_user(roles=["Intern"])

    try:
        response = client.get("/policies/test-org/policy-1/signatures")

        assert response.status_code == 403
    finally:
        app.dependency_overrides[get_current_user] = lambda: _fake_user()


# --------------------------------------------------
# Policy Assignments
# --------------------------------------------------

@patch("main.assign_policy")
@patch("main.get_policy")
def test_assign_policy_success(mock_get_policy, mock_assign):
    mock_get_policy.return_value = SimpleNamespace(
        id="policy-1", title=None, policy_type="Code of Conduct"
    )
    mock_assign.side_effect = lambda org_id, policy_id, **kwargs: {
        "policy_id": policy_id,
        **kwargs,
    }

    response = client.post(
        "/policies/test-org/policy-1/assign",
        json={"user_ids": ["intern-1", "intern-2"]},
    )

    assert response.status_code == 200
    assert len(response.json()) == 2
    assert mock_assign.call_count == 2

    mock_assign.assert_any_call(
        "test-org",
        "policy-1",
        policy_name="Code of Conduct",
        assigned_to_user_id="intern-1",
        assigned_by_user_id="test-oid",
    )


@patch("main.get_policy")
def test_assign_policy_not_found(mock_get_policy):
    mock_get_policy.return_value = None

    response = client.post(
        "/policies/test-org/missing-policy/assign",
        json={"user_ids": ["intern-1"]},
    )

    assert response.status_code == 404


def test_assign_policy_blocks_non_hr_role():
    app.dependency_overrides[get_current_user] = lambda: _fake_user(roles=["Manager"])

    try:
        response = client.post(
            "/policies/test-org/policy-1/assign",
            json={"user_ids": ["intern-1"]},
        )

        assert response.status_code == 403
    finally:
        app.dependency_overrides[get_current_user] = lambda: _fake_user()


@patch("main.get_signature")
@patch("main.list_user_assignments")
def test_user_progress_computes_signed_count(mock_list_assignments, mock_get_signature):
    mock_list_assignments.return_value = [
        SimpleNamespace(policy_id="policy-1", policy_name="Code of Conduct"),
        SimpleNamespace(policy_id="policy-2", policy_name="Security Policy"),
    ]
    # Signed the first, not the second.
    mock_get_signature.side_effect = lambda org_id, policy_id, user_id: (
        {"policy_id": policy_id} if policy_id == "policy-1" else None
    )

    response = client.get("/policies/test-org/users/test-oid/progress")

    assert response.status_code == 200

    data = response.json()

    assert data["assigned"] == 2
    assert data["signed"] == 1
    assert data["policies"][0]["signed"] is True
    assert data["policies"][1]["signed"] is False


@patch("main.list_user_assignments")
def test_user_progress_own_progress_always_allowed(mock_list_assignments):
    mock_list_assignments.return_value = []
    app.dependency_overrides[get_current_user] = lambda: _fake_user(roles=["Intern"])

    try:
        response = client.get("/policies/test-org/users/test-oid/progress")

        assert response.status_code == 200
    finally:
        app.dependency_overrides[get_current_user] = lambda: _fake_user()


def test_user_progress_others_blocked_for_non_hr_manager():
    app.dependency_overrides[get_current_user] = lambda: _fake_user(roles=["Intern"])

    try:
        response = client.get("/policies/test-org/users/someone-else/progress")

        assert response.status_code == 403
    finally:
        app.dependency_overrides[get_current_user] = lambda: _fake_user()


@patch("main.list_user_assignments")
def test_user_progress_others_allowed_for_manager(mock_list_assignments):
    mock_list_assignments.return_value = []
    app.dependency_overrides[get_current_user] = lambda: _fake_user(roles=["Manager"])

    try:
        response = client.get("/policies/test-org/users/someone-else/progress")

        assert response.status_code == 200
    finally:
        app.dependency_overrides[get_current_user] = lambda: _fake_user()


# --------------------------------------------------
# Training Resources
# --------------------------------------------------

@patch("main.create_link_resource")
def test_add_training_link_success(mock_create):
    mock_create.return_value = {
        "id": "resource-1",
        "title": "Onboarding Video",
        "resource_type": "link",
    }

    response = client.post(
        "/training/test-org/link",
        json={
            "title": "Onboarding Video",
            "description": "Intro to company culture",
            "category": "Onboarding",
            "url": "https://example.com/video",
        },
    )

    assert response.status_code == 200
    mock_create.assert_called_once_with(
        "test-org",
        title="Onboarding Video",
        description="Intro to company culture",
        category="Onboarding",
        url="https://example.com/video",
        uploaded_by_user_id="test-oid",
    )


def test_add_training_link_blocks_non_hr_role():
    app.dependency_overrides[get_current_user] = lambda: _fake_user(roles=["Manager"])

    try:
        response = client.post(
            "/training/test-org/link",
            json={
                "title": "Onboarding Video",
                "description": "Intro to company culture",
                "category": "Onboarding",
                "url": "https://example.com/video",
            },
        )

        assert response.status_code == 403
    finally:
        app.dependency_overrides[get_current_user] = lambda: _fake_user()


@patch("main.create_file_resource")
def test_upload_training_file_success(mock_create):
    mock_create.return_value = {
        "id": "resource-1",
        "title": "Employee Handbook",
        "resource_type": "file",
        "original_filename": "handbook.pdf",
    }

    response = client.post(
        "/training/test-org/upload",
        data={
            "title": "Employee Handbook",
            "description": "Full handbook",
            "category": "Handbook",
        },
        files={"file": ("handbook.pdf", b"fake-pdf-bytes", "application/pdf")},
    )

    assert response.status_code == 200
    mock_create.assert_called_once()
    assert mock_create.call_args.kwargs["original_filename"] == "handbook.pdf"
    assert mock_create.call_args.kwargs["file_bytes"] == b"fake-pdf-bytes"


def test_upload_training_file_empty_returns_400():
    response = client.post(
        "/training/test-org/upload",
        data={
            "title": "Employee Handbook",
            "description": "Full handbook",
            "category": "Handbook",
        },
        files={"file": ("handbook.pdf", b"", "application/pdf")},
    )

    assert response.status_code == 400


@patch("main.list_resources")
def test_list_training_resources_allows_any_authenticated_role(mock_list):
    mock_list.return_value = []
    app.dependency_overrides[get_current_user] = lambda: _fake_user(roles=["Intern"])

    try:
        response = client.get("/training/test-org")

        assert response.status_code == 200
    finally:
        app.dependency_overrides[get_current_user] = lambda: _fake_user()


@patch("main.get_resource_file_bytes")
@patch("main.get_resource")
def test_download_training_resource_success(mock_get_resource, mock_get_bytes):
    mock_get_resource.return_value = SimpleNamespace(
        resource_type="file", original_filename="handbook.pdf"
    )
    mock_get_bytes.return_value = b"fake-pdf-bytes"

    response = client.get("/training/test-org/resource-1/download")

    assert response.status_code == 200
    assert response.content == b"fake-pdf-bytes"
    assert 'filename="handbook.pdf"' in response.headers["content-disposition"]


@patch("main.get_resource")
def test_download_training_resource_not_found(mock_get_resource):
    mock_get_resource.return_value = None

    response = client.get("/training/test-org/missing/download")

    assert response.status_code == 404


@patch("main.get_resource")
def test_download_training_link_resource_returns_400(mock_get_resource):
    mock_get_resource.return_value = SimpleNamespace(
        resource_type="link", original_filename=None
    )

    response = client.get("/training/test-org/resource-1/download")

    assert response.status_code == 400


# --------------------------------------------------
# Adherence
# --------------------------------------------------

@patch("main.acknowledge")
def test_acknowledge_adherence_success(mock_acknowledge):
    mock_acknowledge.return_value = {"org_id": "test-org", "user_id": "test-oid"}

    response = client.post("/adherence/test-org/acknowledge")

    assert response.status_code == 200
    mock_acknowledge.assert_called_once_with("test-org", "test-oid")


@patch("main.get_acknowledgment")
def test_adherence_status_true(mock_get_ack):
    mock_get_ack.return_value = {"org_id": "test-org", "user_id": "test-oid"}

    response = client.get("/adherence/test-org/acknowledged-by-me")

    assert response.status_code == 200
    assert response.json()["acknowledged"] is True


@patch("main.get_acknowledgment")
def test_adherence_status_false(mock_get_ack):
    mock_get_ack.return_value = None

    response = client.get("/adherence/test-org/acknowledged-by-me")

    assert response.status_code == 200
    assert response.json()["acknowledged"] is False