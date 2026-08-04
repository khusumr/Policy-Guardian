from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


class PolicyRequest(BaseModel):
    company_name: str
    policy_type: str
    tone: str
    requirements: list[str]


@app.get("/")
def home():
    return {"message": "Backend is working!"}


@app.post("/generate-policy")
def generate_policy(request: PolicyRequest):
    return {
        "message": "Questionnaire received successfully!",
        "company_name": request.company_name,
        "policy_type": request.policy_type,
        "tone": request.tone,
        "requirements": request.requirements,
    }
    