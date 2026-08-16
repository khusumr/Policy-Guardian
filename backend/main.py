from enum import Enum
from io import BytesIO

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, field_validator

from openai_service import OpenAIService
from prompt_builder import build_policy_prompt
from logger import get_logger
from policy_repository import create_policy, get_policy, list_policies
from models import StoredPolicy
from file_service import policy_to_docx_bytes, policy_to_pdf_bytes


# --------------------------------------------------
# FastAPI Application
# --------------------------------------------------

app = FastAPI(
    title="AI Policy Generator API",
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

    requirements: list[str] = Field(
        ...,
        min_length=1,
        max_length=20,
    )

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

    return {
        "policy": policy
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
        prompt = build_policy_prompt(
            company_name=request.company_name,
            policy_type=request.policy_type.value,
            tone=request.tone.value,
            requirements=request.requirements,
        )

        content = openai_service.generate_policy(prompt)

        policy = StoredPolicy(
            company_name=request.company_name,
            policy_type=request.policy_type.value,
            tone=request.tone.value,
            requirements=request.requirements,
            content=content,
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
        title = (
            f"{policy.company_name} "
            f"{policy.policy_type}"
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
        title = (
            f"{policy.company_name} "
            f"{policy.policy_type}"
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