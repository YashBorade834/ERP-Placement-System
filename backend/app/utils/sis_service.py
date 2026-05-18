import httpx
import logging
from typing import Optional, Dict, Any, List
from app.config import SIS_BASE_URL

logger = logging.getLogger(__name__)

class SISService:
    @staticmethod
    async def get_student_details(student_id: int) -> Optional[Dict[str, Any]]:
        """
        Fetch full student details from the SIS Module.
        """
        url = f"{SIS_BASE_URL}/api/v1/students/{student_id}"
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, timeout=5.0)
                if response.status_code == 200:
                    data = response.json()
                    # Handle case where SIS returns a list
                    if isinstance(data, list) and len(data) > 0:
                        return data[0]
                    return data
                else:
                    logger.warning(f"SIS returned {response.status_code} for student {student_id}")
                    return None
        except Exception as e:
            logger.error(f"Error connecting to SIS for student {student_id}: {str(e)}")
            return None

    @staticmethod
    async def get_students_by_role(role: str) -> List[Dict[str, Any]]:
        """
        Fetch all students/users matching a specific role.
        """
        url = f"{SIS_BASE_URL}/api/v1/students?role={role}"
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, timeout=10.0)
                if response.status_code == 200:
                    return response.json()
                return []
        except Exception as e:
            logger.error(f"Error fetching students by role {role}: {str(e)}")
            return []

    @staticmethod
    async def get_students_by_department(department: str) -> List[Dict[str, Any]]:
        """
        Fetch all students in a specific department.
        """
        url = f"{SIS_BASE_URL}/api/v1/students?department={department}"
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, timeout=10.0)
                if response.status_code == 200:
                    return response.json()
                return []
        except Exception as e:
            logger.error(f"Error fetching students for department {department}: {str(e)}")
            return []
