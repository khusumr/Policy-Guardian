from openai import OpenAI

from settings import (
    AZURE_OPENAI_ENDPOINT,
    AZURE_OPENAI_API_KEY,
    AZURE_OPENAI_DEPLOYMENT,
)


class OpenAIService:
    def __init__(self):
        self.client = OpenAI(
            api_key=AZURE_OPENAI_API_KEY,
            base_url=AZURE_OPENAI_ENDPOINT.rstrip("/") + "/openai/v1/",
        )

        self.deployment = AZURE_OPENAI_DEPLOYMENT

    def generate_policy(self, prompt: str) -> str:
        response = self.client.responses.create(
            model=self.deployment,
            input=prompt,
        )

        return response.output_text
        