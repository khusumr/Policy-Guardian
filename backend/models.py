from enum import Enum
from datetime import datetime
from pydantic import BaseModel, Field
import uuid


class PolicyStatus(str, Enum):
    draft = "draft"
    under_review = "under_review"
    active = "active"
    expired = "expired"


class StoredPolicy(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_name: str
    policy_type: str
    tone: str
    requirements: list[str]
    content: str
    status: PolicyStatus = PolicyStatus.draft
    version: int = 1
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    review_date: datetime | None = None