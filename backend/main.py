from enum import Enum
from io import BytesIO

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, field_validator, model_validator

from openai_service import OpenAIService
from prompt_builder import build_policy_prompt
from logger import get_logger
from policy_repository import (
    create_policy,
    get_policy,
    list_policies,
    update_policy,
    get_policy_history,
)
from models import StoredPolicy, PolicySource
from file_service import policy_to_docx_bytes, policy_to_pdf_bytes
from document_parser import extract_text_from_upload, UnsupportedFileTypeError
from search_service import get_reference_links


# --------------------------------------------------
# FastAPI Application
# --------------------------------------------------

app = FastAPI(
    title="Policy Pilot API",
    description=(
        "Backend API for generating, refining, storing, "
        "retrieving, and exporting HR policies using Azure OpenAI."
    ),
    version="1.0.0",
)


# --------------------------------------------------
# CORS
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


openai_service = OpenAIService()
logger = get_logger(__name__)


# --------------------------------------------------
# Enums
# --------------------------------------------------

class PolicyType(str, Enum):
    work_from_home = "Work From Home"
    paid_time_off = "Paid Time Off"
    code_of_conduct = "Code of Conduct"
    expense_reimbursement = "Expense Reimbursement"
    custom_section = "Custom Section"

    attendance = "Attendance Policy"
    leave = "Leave Policy"
    dress_code = "Dress Code"
    security = "Security Policy"
    travel = "Travel Policy"
    remote_work = "Remote Work Policy"


class Tone(str, Enum):
    professional = "Professional"
    formal = "Formal"
    friendly = "Friendly"
    simple = "Simple"


# --------------------------------------------------
# Request Models
# --------------------------------------------------

class PolicyRequest(BaseModel):
    company_name: str = Field(
        ...,
        min_length=2,
        max_length=100,
    )

    policy_type: PolicyType
    tone: Tone

    # Required when policy_type is "Custom Section" — otherwise the AI has
    # no actual subject to write about, since "Custom Section" itself
    # isn't a topic (see build_policy_prompt). Optional for the other,
    # predefined policy types.
    title: str | None = Field(
        default=None,
        max_length=150,
    )

    requirements: list[str] = Field(
        ...,
        min_length=1,
        max_length=20,
    )

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str | None):
        if value is None:
            return value

        value = value.strip()

        return value or None

    # Optional — when the caller already has finished policy text (e.g. a
    # section a user has edited/reworded in the frontend), pass it here to
    # store it as-is instead of having this endpoint generate new content
    # from `requirements`. Lets "save for export" reflect exactly what's on
    # screen rather than a fresh, possibly different AI generation.
    content: str | None = Field(
        default=None,
        max_length=20000,
    )

    @field_validator("content")
    @classmethod
    def validate_content(cls, value: str | None):
        if value is None:
            return value

        value = value.strip()

        return value or None

    @field_validator("company_name")
    @classmethod
    def validate_company_name(cls, value: str):
        value = value.strip()

        if not value:
            raise ValueError("Company name cannot be blank.")

        return value

    @field_validator("requirements")
    @classmethod
    def validate_requirements(cls, requirements: list[str]):
        cleaned_requirements = []

        for requirement in requirements:
            requirement = requirement.strip()

            if not requirement:
                raise ValueError("Requirements cannot be blank.")

            cleaned_requirements.append(requirement)

        return cleaned_requirements

    @model_validator(mode="after")
    def validate_custom_section_has_title(self):
        if self.policy_type == PolicyType.custom_section and not self.title:
            raise ValueError(
                "title is required when policy_type is 'Custom Section' — "
                "otherwise there's no actual subject for the policy."
            )

        return self


class RefinePolicyRequest(BaseModel):
    current_policy: str = Field(
        ...,
        min_length=10,
        max_length=20000,
    )

    instruction: str = Field(
        ...,
        min_length=3,
        max_length=500,
    )

    @field_validator("current_policy", "instruction")
    @classmethod
    def validate_not_blank(cls, value: str):
        value = value.strip()

        if not value:
            raise ValueError("Field cannot be blank.")

        return value


class AskAIRequest(BaseModel):
    highlighted_text: str = Field(
        ...,
        min_length=3,
        max_length=20000,
    )

    question: str = Field(
        ...,
        min_length=3,
        max_length=500,
    )

    @field_validator("highlighted_text", "question")
    @classmethod
    def validate_not_blank(cls, value: str):
        value = value.strip()

        if not value:
            raise ValueError("Field cannot be blank.")

        return value


class UpdatePolicyRequest(BaseModel):
    content: str = Field(..., min_length=10, max_length=20000)
    edited_by: str | None = None


# --------------------------------------------------
# Health
# --------------------------------------------------

@app.get(
    "/",
    tags=["Health"],
    summary="Backend health check",
)
def home():
    return {
        "message": "Backend is working!"
    }


# --------------------------------------------------
# AI Policy Generation
# --------------------------------------------------

@app.post(
    "/generate-policy",
    tags=["AI Policies"],
    summary="Generate a new HR policy",
)
def generate_policy_endpoint(request: PolicyRequest):

    logger.info(
        f"Received policy generation request: "
        f"company={request.company_name}, "
        f"type={request.policy_type.value}, "
        f"tone={request.tone.value}"
    )

    try:
        prompt = build_policy_prompt(
            company_name=request.company_name,
            policy_type=request.policy_type.value,
            tone=request.tone.value,
            requirements=request.requirements,
            title=request.title,
        )

        policy = openai_service.generate_policy(prompt)

    except Exception as e:
        logger.error(f"Policy generation failed: {e}")

        raise HTTPException(
            status_code=500,
            detail="Failed to generate policy. Please try again.",
        )

    logger.info(
        f"Successfully generated policy for {request.company_name}"
    )

    further_reading = get_reference_links(request.policy_type.value)

    return {
        "policy": policy,
        "further_reading": further_reading,
    }


# --------------------------------------------------
# AI Policy Refinement
# --------------------------------------------------

@app.post(
    "/refine-policy",
    tags=["AI Policies"],
    summary="Refine an existing HR policy",
)
def refine_policy_endpoint(request: RefinePolicyRequest):

    logger.info("Received policy refinement request")

    prompt = f"""
You are an experienced HR policy writer.

Below is the exact text selected by the user:

--- SELECTED TEXT ---
{request.current_policy}
--- END SELECTED TEXT ---

User instruction:
{request.instruction}

Revise only the selected text according to the user's instruction.

Important rules:
- Return only the revised text.
- Do not add headings, titles, labels, bullet points, or section names unless they already exist in the selected text.
- Do not add explanations before or after the revised text.
- Preserve the meaning unless the user's instruction specifically asks for a change.
- Keep the response concise and appropriate for a professional HR policy.
"""

    try:
        refined_policy = openai_service.generate_policy(prompt)

    except Exception as e:
        logger.error(f"Policy refinement failed: {e}")

        raise HTTPException(
            status_code=500,
            detail="Failed to refine policy. Please try again.",
        )

    logger.info("Successfully refined policy")

    return {
        "policy": refined_policy
    }

# --------------------------------------------------
# Ask AI About Selected Policy Text
# --------------------------------------------------

@app.post(
    "/ask-ai",
    tags=["AI Policies"],
    summary="Ask AI a question about selected policy text",
)
def ask_ai(request: AskAIRequest):
    logger.info("Received Ask AI request")

    try:
        prompt = f"""
You are an HR policy assistant.

The user selected this text from an HR policy:

--- SELECTED TEXT ---
{request.highlighted_text}
--- END SELECTED TEXT ---

User question:
{request.question}

Answer the user's question clearly and concisely.

Important rules:
- Answer only based on the selected policy text.
- Do not invent company-specific information.
- Explain the text in clear, easy-to-understand language.
- Do not rewrite the policy unless the user specifically asks for an explanation of wording.
"""

        answer = openai_service.generate_policy(prompt)

        logger.info("Successfully answered Ask AI question")

        return {
            "answer": answer
        }

    except Exception as e:
        logger.error(f"Ask AI failed: {e}")

        raise HTTPException(
            status_code=500,
            detail="Failed to answer question. Please try again.",
        )


# --------------------------------------------------
# Policy Storage
# --------------------------------------------------

@app.post(
    "/policies",
    tags=["Policy Storage"],
    summary="Generate and save a policy",
)
def save_generated_policy(
    org_id: str,
    request: PolicyRequest,
):

    logger.info(
        f"Saving generated policy for "
        f"org={org_id}, company={request.company_name}"
    )

    try:
        if request.content is not None:
            content = request.content
        else:
            prompt = build_policy_prompt(
                company_name=request.company_name,
                policy_type=request.policy_type.value,
                tone=request.tone.value,
                requirements=request.requirements,
                title=request.title,
            )

            content = openai_service.generate_policy(prompt)

        policy = StoredPolicy(
            company_name=request.company_name,
            policy_type=request.policy_type.value,
            title=request.title,
            tone=request.tone.value,
            requirements=request.requirements,
            content=content,
            further_reading=get_reference_links(request.policy_type.value),
        )

        saved = create_policy(
            org_id,
            policy,
        )

    except Exception as e:
        logger.error(f"Failed to save policy: {e}")

        raise HTTPException(
            status_code=500,
            detail="Failed to save policy. Please try again.",
        )

    logger.info(
        f"Successfully saved policy for org={org_id}"
    )

    return saved


@app.get(
    "/policies/{org_id}/{policy_id}",
    tags=["Policy Storage"],
    summary="Retrieve one saved policy",
)
def fetch_policy(
    org_id: str,
    policy_id: str,
):

    policy = get_policy(
        org_id,
        policy_id,
    )

    if not policy:
        raise HTTPException(
            status_code=404,
            detail="Policy not found",
        )

    return policy


@app.get(
    "/policies/{org_id}",
    tags=["Policy Storage"],
    summary="Retrieve all policies for an organization",
)
def fetch_all_policies(org_id: str):
    return list_policies(org_id)


@app.post(
    "/policies/{org_id}/upload",
    tags=["Policy Storage"],
    summary="Upload an existing policy",
)
async def upload_policy(
    org_id: str,
    company_name: str = Form(...),
    policy_type: PolicyType = Form(...),
    file: UploadFile = File(...),
):
    logger.info(
        f"Received policy upload for org={org_id}, filename={file.filename}"
    )

    try:
        file_bytes = await file.read()
        extracted_text = extract_text_from_upload(file.filename, file_bytes)

        if not extracted_text.strip():
            raise HTTPException(
                status_code=400,
                detail="Could not extract any text from the uploaded file.",
            )

        policy = StoredPolicy(
            company_name=company_name,
            policy_type=policy_type.value,
            tone="Uploaded",
            requirements=[],
            content=extracted_text,
            source=PolicySource.uploaded,
            original_filename=file.filename,
        )

        saved = create_policy(org_id, policy)

    except UnsupportedFileTypeError as e:
        logger.warning(f"Unsupported upload type: {e}")

        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Policy upload failed: {e}")

        raise HTTPException(
            status_code=500,
            detail="Failed to upload policy. Please try again.",
        )

    logger.info(f"Successfully uploaded and saved policy for org={org_id}")

    return saved


@app.patch(
    "/policies/{org_id}/{policy_id}",
    tags=["Policy Storage"],
    summary="Edit a saved policy (creates a new version)",
)
def edit_policy(
    org_id: str,
    policy_id: str,
    request: UpdatePolicyRequest,
):
    updated = update_policy(
        org_id,
        policy_id,
        {"content": request.content},
        edited_by=request.edited_by,
    )

    if not updated:
        raise HTTPException(
            status_code=404,
            detail="Policy not found",
        )

    return updated


@app.get(
    "/policies/{org_id}/{policy_id}/history",
    tags=["Policy Storage"],
    summary="Get version history for a policy",
)
def policy_history(org_id: str, policy_id: str):
    return get_policy_history(org_id, policy_id)


# --------------------------------------------------
# Policy Export
# --------------------------------------------------

@app.get(
    "/policies/{org_id}/{policy_id}/export/docx",
    tags=["Policy Export"],
    summary="Export a saved policy as DOCX",
)
def export_policy_docx(
    org_id: str,
    policy_id: str,
):

    policy = get_policy(
        org_id,
        policy_id,
    )

    if not policy:
        raise HTTPException(
            status_code=404,
            detail="Policy not found",
        )

    try:
        # For Custom Section policies, policy_type isn't a real subject
        # (see prompt_builder.py) — use the actual title instead so the
        # export isn't literally named "{company} Custom Section".
        subject = policy.title if (policy.policy_type == "Custom Section" and policy.title) else policy.policy_type
        title = (
            f"{policy.company_name} "
            f"{subject}"
        )

        docx_bytes = policy_to_docx_bytes(
            policy.content,
            title,
        )

        return StreamingResponse(
            BytesIO(docx_bytes),
            media_type=(
                "application/vnd.openxmlformats-officedocument."
                "wordprocessingml.document"
            ),
            headers={
                "Content-Disposition":
                    f'attachment; filename="{policy_id}.docx"'
            },
        )

    except Exception as e:
        logger.error(f"DOCX export failed: {e}")

        raise HTTPException(
            status_code=500,
            detail="Failed to export policy as DOCX.",
        )


@app.get(
    "/policies/{org_id}/{policy_id}/export/pdf",
    tags=["Policy Export"],
    summary="Export a saved policy as PDF",
)
def export_policy_pdf(
    org_id: str,
    policy_id: str,
):

    policy = get_policy(
        org_id,
        policy_id,
    )

    if not policy:
        raise HTTPException(
            status_code=404,
            detail="Policy not found",
        )

    try:
        # For Custom Section policies, policy_type isn't a real subject
        # (see prompt_builder.py) — use the actual title instead so the
        # export isn't literally named "{company} Custom Section".
        subject = policy.title if (policy.policy_type == "Custom Section" and policy.title) else policy.policy_type
        title = (
            f"{policy.company_name} "
            f"{subject}"
        )

        pdf_bytes = policy_to_pdf_bytes(
            policy.content,
            title,
        )

        return StreamingResponse(
            BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition":
                    f'attachment; filename="{policy_id}.pdf"'
            },
        )

    except Exception as e:
        logger.error(f"PDF export failed: {e}")

        raise HTTPException(
            status_code=500,
            detail="Failed to export policy as PDF.",
        )