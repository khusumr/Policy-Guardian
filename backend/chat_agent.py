from openai_service import OpenAIService
from logger import get_logger

logger = get_logger(__name__)

# Kept short and generic on purpose - the widget appears on the public
# Landing page (no signed-in user, no org context) as well as HRDashboard,
# so the prompt can't assume a role or reference a specific policy the way
# /ask-ai does for highlighted text.
SYSTEM_CONTEXT = """You are the small help-chat widget on Policy Guardian, \
an HR policy platform. Visitors may not be signed in yet.

Answer briefly and helpfully. If the question needs specifics you don't \
have (a company's actual policy text, an account, a signed-in role), say \
so plainly and point them to signing in or asking HR - don't invent \
company-specific policy details."""

MAX_CHARS_FOR_MESSAGE = 2000


class ChatAgentError(Exception):
    """Raised when the chat backend can't produce a reply - callers should
    show a generic "try again" message rather than a fabricated answer."""


def _build_prompt(message: str) -> str:
    return f"""{SYSTEM_CONTEXT}

User message:
{message[:MAX_CHARS_FOR_MESSAGE]}

Reply directly to the user - no preamble, no restating the question."""


def answer_chat_message(message: str) -> str:
    if not message.strip():
        raise ChatAgentError("message is empty - nothing to answer.")

    service = OpenAIService()
    prompt = _build_prompt(message)

    try:
        reply = service.generate_policy(prompt)
    except Exception as exc:
        raise ChatAgentError(f"LLM call failed: {exc}") from exc

    reply = reply.strip()

    if not reply:
        raise ChatAgentError("LLM returned an empty reply.")

    return reply
