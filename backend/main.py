from enum import Enum

from fastapi import FastAPI
from pydantic import BaseModel, Field

from prompt_builder import build_policy_prompt


app = FastAPI()


class PolicyType(str, Enum):
    work_from_home = "Work From Home"
    attendance = "Attendance Policy"
    leave = "Leave Policy"
    dress_code = "Dress Code"
    code_of_conduct = "Code of Conduct"
    security = "Security Policy"
    travel = "Travel Policy"
    remote_work = "Remote Work Policy"


class Tone(str, Enum):
    professional = "Professional"
    formal = "Formal"
    friendly = "Friendly"
    simple = "Simple"


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


@app.get("/")
def home():
    return {"message": "Backend is working!"}


@app.post("/generate-policy")
def generate_policy(request: PolicyRequest):
    prompt = build_policy_prompt(
        company_name=request.company_name,
        policy_type=request.policy_type.value,
        tone=request.tone.value,
        requirements=request.requirements,
    )

    return {"prompt": prompt}