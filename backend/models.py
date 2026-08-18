from enum import Enum
from datetime import datetime, UTC
from pydantic import BaseModel, Field
import uuid


class PolicyStatus(str, Enum):
    draft = "draft"
    under_review = "under_review"
    active = "active"
    expired = "expired"


class PolicySource(str, Enum):
    generated = "generated"
    uploaded = "uploaded"


class StoredPolicy(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_name: str
    policy_type: str
    tone: str
    requirements: list[str]
    content: str
    status: PolicyStatus = PolicyStatus.draft
    source: PolicySource = PolicySource.generated
    original_filename: str | None = None
    version: int = 1
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    review_date: datetime | None = None


class PolicyVersion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    policy_id: str
    version: int
    content: str
    tone: str
    edited_by: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))