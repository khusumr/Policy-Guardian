from settings import (
    AZURE_OPENAI_ENDPOINT,
    AZURE_OPENAI_API_KEY,
    AZURE_OPENAI_DEPLOYMENT,
)


class OpenAIService:
    def __init__(self):
        self.endpoint = AZURE_OPENAI_ENDPOINT
        self.api_key = AZURE_OPENAI_API_KEY
        self.deployment = AZURE_OPENAI_DEPLOYMENT

    def generate_policy(self, prompt: str) -> str:
        """
        Placeholder until Azure OpenAI credentials are provided.
        """

        return f"""
Azure OpenAI Placeholder

Endpoint: {self.endpoint}
Deployment: {self.deployment}

Prompt Received:

{prompt}
"""