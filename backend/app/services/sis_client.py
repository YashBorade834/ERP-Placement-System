import httpx
import logging
from typing import Any, Dict, List, Optional

from app.config import SIS_BASE_URL

logger = logging.getLogger(__name__)

class SISClient:
    """Async client for Student Information System (SIS)."""

    def __init__(self, timeout: float = 5.0) -> None:
        self.base_url = SIS_BASE_URL.rstrip('/')
        self.timeout = timeout
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=self.timeout)
        return self._client

    async def _request(self, method: str, path: str, **kwargs) -> Optional[Dict[str, Any]]:
        url = f"{self.base_url}{path}"
        client = await self._get_client()
        try:
            response = await client.request(method, url, **kwargs)
            response.raise_for_status()
            return response.json()
        except httpx.RequestError as exc:
            logger.error(f"SIS request error: {exc}")
        except httpx.HTTPStatusError as exc:
            logger.error(f"SIS HTTP error {exc.response.status_code}: {exc.response.text}")
        return None

    async def get_student_details(self, student_id: int) -> Optional[Dict[str, Any]]:
        """Fetch basic student details.

        Returns the JSON dict or ``None`` on error.
        """
        return await self._request("GET", f"/api/students/{student_id}")

    async def get_student_academic_data(self, student_id: int) -> Optional[Dict[str, Any]]:
        """Placeholder for future academic endpoint.
        Currently forwards to the same endpoint; can be extended later.
        """
        return await self._request("GET", f"/api/students/{student_id}/academic")
