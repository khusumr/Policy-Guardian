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


class ReferenceLink(BaseModel):
    title: str
    url: str
    source: str
    description: str


class StoredPolicy(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_name: str
    policy_type: str
    # Only meaningful (and set) for policy_type == "Custom Section", where
    # policy_type itself isn't a real subject — see prompt_builder.py.
    # None for predefined policy types, where policy_type already names
    # the subject.
    title: str | None = None
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
    further_reading: list[ReferenceLink] = Field(default_factory=list)


class PolicyVersion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    policy_id: str
    version: int
    content: str
    tone: str
    edited_by: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class PolicySignature(BaseModel):
    policy_id: str
    # From the caller's Entra token (auth.CurrentUser), not user-supplied —
    # signed_name below is the user-typed name, kept separate so a
    # signature can't be forged by typing someone else's name while
    # authenticated as a different account.
    signer_user_id: str
    signer_roles: list[str] = Field(default_factory=list)
    signed_name: str
    signed_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class PolicyAssignment(BaseModel):
    # Records that HR sent a specific policy to a specific employee.
    # Progress ("1/2 policies signed") is computed from these, scoped to
    # what an employee was actually sent — not every policy in the org.
    policy_id: str
    policy_name: str
    assigned_to_user_id: str
    assigned_by_user_id: str
    assigned_at: datetime = Field(default_factory=lambda: datetime.now(UTC))