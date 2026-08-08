import json
from azure.storage.blob import BlobServiceClient
from settings import AZURE_STORAGE_CONNECTION_STRING
from logger import get_logger

logger = get_logger(__name__)

CONTAINER_NAME = "policies"


class StorageService:
    def __init__(self):
        self.client = BlobServiceClient.from_connection_string(
            AZURE_STORAGE_CONNECTION_STRING
        )
        self.container = self.client.get_container_client(CONTAINER_NAME)
        try:
            self.container.create_container()
        except Exception:
            pass  # already exists

    def save_json(self, blob_name: str, data: dict) -> None:
        logger.info(f"Saving blob: {blob_name}")
        self.container.upload_blob(
            blob_name, json.dumps(data, default=str), overwrite=True
        )

    def load_json(self, blob_name: str) -> dict | None:
        try:
            blob = self.container.download_blob(blob_name)
            return json.loads(blob.readall())
        except Exception:
            logger.warning(f"Blob not found: {blob_name}")
            return None

    def delete_blob(self, blob_name: str) -> None:
        self.container.delete_blob(blob_name)

    def list_blobs(self, prefix: str) -> list[str]:
        return [b.name for b in self.container.list_blobs(name_starts_with=prefix)]