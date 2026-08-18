import json

from azure.storage.blob import BlobServiceClient

from settings import AZURE_STORAGE_CONNECTION_STRING
from logger import get_logger


logger = get_logger(__name__)

CONTAINER_NAME = "generated-policies"


class StorageService:
    def __init__(self):
        self.client = None
        self.container = None

        if not AZURE_STORAGE_CONNECTION_STRING:
            logger.warning(
                "AZURE_STORAGE_CONNECTION_STRING is not configured. "
                "Blob Storage operations will be unavailable."
            )
            return

        try:
            self.client = BlobServiceClient.from_connection_string(
                AZURE_STORAGE_CONNECTION_STRING
            )

            self.container = self.client.get_container_client(CONTAINER_NAME)

            try:
                self.container.create_container()
            except Exception:
                pass  # container already exists

        except Exception as exc:
            logger.error(f"Failed to initialize Blob Storage: {exc}")
            self.client = None
            self.container = None

    def _ensure_storage_available(self):
        if self.container is None:
            raise RuntimeError(
                "Azure Blob Storage is not configured. "
                "Set AZURE_STORAGE_CONNECTION_STRING."
            )

    def save_json(self, blob_name: str, data: dict) -> None:
        self._ensure_storage_available()

        logger.info(f"Saving blob: {blob_name}")

        self.container.upload_blob(
            blob_name,
            json.dumps(data, default=str),
            overwrite=True,
        )

    def load_json(self, blob_name: str) -> dict | None:
        self._ensure_storage_available()

        try:
            blob = self.container.download_blob(blob_name)
            return json.loads(blob.readall())

        except Exception:
            logger.warning(f"Blob not found: {blob_name}")
            return None

    def delete_blob(self, blob_name: str) -> None:
        self._ensure_storage_available()

        self.container.delete_blob(blob_name)

    def list_blobs(self, prefix: str) -> list[str]:
        self._ensure_storage_available()

        return [
            blob.name
            for blob in self.container.list_blobs(
                name_starts_with=prefix
            )
        ]