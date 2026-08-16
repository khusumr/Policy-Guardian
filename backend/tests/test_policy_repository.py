import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))

import pytest
from unittest.mock import MagicMock
from models import StoredPolicy
import policy_repository


@pytest.fixture(autouse=True)
def mock_storage(monkeypatch):
    mock = MagicMock()
    monkeypatch.setattr(policy_repository, "storage", mock)
    return mock


def test_create_policy(mock_storage):
    policy = StoredPolicy(
        company_name="Acme",
        policy_type="WFH",
        tone="Professional",
        requirements=["test"],
        content="Sample content",
    )
    result = policy_repository.create_policy("org1", policy)
    assert result.id == policy.id
    mock_storage.save_json.assert_called_once()