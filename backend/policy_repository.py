from models import StoredPolicy
from storage_service import StorageService
from datetime import datetime
from logger import get_logger

logger = get_logger(__name__)
storage = StorageService()


def _blob_path(org_id: str, policy_id: str) -> str:
    return f"{org_id}/{policy_id}.json"


def create_policy(org_id: str, policy: StoredPolicy) -> StoredPolicy:
    storage.save_json(_blob_path(org_id, policy.id), policy.model_dump())
    logger.info(f"Created policy {policy.id} for org {org_id}")
    return policy


def get_policy(org_id: str, policy_id: str) -> StoredPolicy | None:
    data = storage.load_json(_blob_path(org_id, policy_id))
    return StoredPolicy(**data) if data else None


def update_policy(org_id: str, policy_id: str, updates: dict) -> StoredPolicy | None:
    existing = get_policy(org_id, policy_id)
    if not existing:
        return None
    updated_data = existing.model_dump()
    updated_data.update(updates)
    updated_data["updated_at"] = datetime.utcnow()
    updated_data["version"] = existing.version + 1
    updated_policy = StoredPolicy(**updated_data)
    storage.save_json(_blob_path(org_id, policy_id), updated_policy.model_dump())
    return updated_policy


def delete_policy(org_id: str, policy_id: str) -> None:
    storage.delete_blob(_blob_path(org_id, policy_id))


def list_policies(org_id: str) -> list[StoredPolicy]:
    blob_names = storage.list_blobs(prefix=f"{org_id}/")
    policies = []
    for name in blob_names:
        data = storage.load_json(name)
        if data:
            policies.append(StoredPolicy(**data))
    return policies