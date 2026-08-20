import sys
from pathlib import Path
from unittest.mock import patch

sys.path.append(str(Path(__file__).resolve().parent.parent))

import pytest

from chat_agent import answer_chat_message, ChatAgentError


@patch("chat_agent.OpenAIService")
def test_answer_chat_message_returns_reply(mock_service_cls):
    mock_service = mock_service_cls.return_value
    mock_service.generate_policy.return_value = "You can find that under the Policies tab."

    result = answer_chat_message("Where do I find the PTO policy?")

    assert result == "You can find that under the Policies tab."


@patch("chat_agent.OpenAIService")
def test_answer_chat_message_strips_whitespace(mock_service_cls):
    mock_service = mock_service_cls.return_value
    mock_service.generate_policy.return_value = "  Sure, here you go.  \n"

    result = answer_chat_message("Hi")

    assert result == "Sure, here you go."


def test_answer_chat_message_rejects_empty_message():
    with pytest.raises(ChatAgentError):
        answer_chat_message("   ")


@patch("chat_agent.OpenAIService")
def test_answer_chat_message_raises_on_llm_failure(mock_service_cls):
    mock_service = mock_service_cls.return_value
    mock_service.generate_policy.side_effect = Exception("Azure OpenAI unavailable")

    with pytest.raises(ChatAgentError):
        answer_chat_message("Hi")


@patch("chat_agent.OpenAIService")
def test_answer_chat_message_raises_on_empty_reply(mock_service_cls):
    mock_service = mock_service_cls.return_value
    mock_service.generate_policy.return_value = "   "

    with pytest.raises(ChatAgentError):
        answer_chat_message("Hi")
