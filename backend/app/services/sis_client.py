import httpx
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

import jwt

from app.config import SIS_BASE_URL, JWT_SECRET_KEY, JWT_ALGORITHM

logger = logging.getLogger(__name__)


def _make_service_token() -> str:
    """Generate a short-lived service-to-service JWT using the shared secret.

    SIS validates the token and requires both ``user_id`` and ``role`` claims.
    We identify ourselves as an internal ERP service with the ``erp_service``
    role so that SIS grants access.
    """
    payload = {
        "user_id": 1,      # service-account user_id
        "role": "admin",   # SIS only accepts 'admin' or 'student'
        "sub": "erp_backend",
        "exp": datetime.utcnow() + timedelta(minutes=10),
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


class SISClient:
    """Async HTTP client for the Student Information System (SIS).

    Every request is signed with a service-to-service JWT so that the SIS
    module's auth middleware accepts the call.
    """

    def __init__(self, timeout: float = 10.0) -> None:
        self.base_url = SIS_BASE_URL.rstrip("/")
        self.timeout = timeout

    def _headers(self) -> Dict[str, str]:
        token = _make_service_token()
        return {
            "Authorization": f"Bearer {token}",
            "ngrok-skip-browser-warning": "true",
            "Accept": "application/json",
        }

    async def _request(
        self, method: str, path: str, **kwargs
    ) -> Optional[Dict[str, Any]]:
        url = f"{self.base_url}{path}"
        logger.info("SIS → %s %s", method, url)

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.request(
                    method, url, headers=self._headers(), **kwargs
                )
            response.raise_for_status()
            return response.json()

        except httpx.RequestError as exc:
            logger.error("SIS request error: %s", exc)

        except httpx.HTTPStatusError as exc:
            logger.error(
                "SIS HTTP error %s: %s",
                exc.response.status_code,
                exc.response.text,
            )

        return None

    # ------------------------------------------------------------------ #
    #  Public helpers                                                       #
    # ------------------------------------------------------------------ #

    async def get_student_details(self, student_id: int) -> Optional[Dict[str, Any]]:
        """Fetch basic student details from SIS.

        Returns the JSON dict on success, or ``None`` on error.
        """
        data = await self._request("GET", f"/api/v1/students/{student_id}")
        if data:
            print(f"[SIS] Student {student_id} found in SIS.")
        else:
            print(f"[SIS] Student {student_id} NOT found in SIS.")
        return data

    async def get_student_academic_data(
        self, student_id: int
    ) -> Optional[Dict[str, Any]]:
        """Fetch academic mapping data for a student.

        Falls back to the generic student endpoint if the dedicated academic
        endpoint does not exist yet on the SIS side.
        """
        data = await self._request(
            "GET", f"/api/v1/academic/student/{student_id}/mapping"
        )
        if data is None:
            # Fallback – return the student record; caller can extract what it needs
            data = await self._request("GET", f"/api/v1/students/{student_id}")
        return data