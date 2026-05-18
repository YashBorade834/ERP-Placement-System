import httpx
import logging
from typing import List, Optional
from app.config import NOTIFICATION_BASE_URL, NOTIFICATION_API_KEY

logger = logging.getLogger(__name__)

async def send_bulk_notification(
    event_type: str,
    title: str,
    message: str,
    recipient_roles: List[str] = ["student"],
    delivery_modes: List[str] = ["email", "sms", "whatsapp"],
    department: Optional[str] = None
):
    """
    Sends bulk notifications to entire roles/departments.
    """
    url = f"{NOTIFICATION_BASE_URL}/api/module-notification"
    
    payload = {
        "api_key": NOTIFICATION_API_KEY,
        "module_name": "Placement Module",
        "event_type": event_type,
        "title": title,
        "message": message,
        "recipient_roles": recipient_roles,
        "delivery_modes": delivery_modes
    }
    
    if department:
        payload["department"] = department

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, timeout=10.0)
            response.raise_for_status()
            return response.json()
    except Exception as e:
        logger.error(f"Failed to send bulk notification: {str(e)}")
        return {"error": str(e)}

async def send_single_notification(
    event_type: str,
    title: str,
    message: str,
    recipient_emails: List[str],
    delivery_modes: List[str] = ["email", "sms", "whatsapp"],
    department: str = "All"
):
    """
    Sends notification to specific students/members.
    """
    url = f"{NOTIFICATION_BASE_URL}/api/module-notification"
    
    payload = {
        "api_key": NOTIFICATION_API_KEY,
        "module_name": "Placement Module",
        "event_type": event_type,
        "title": title,
        "message": message,
        "recipient_emails": recipient_emails,
        "delivery_modes": delivery_modes,
        "department": department
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, timeout=10.0)
            response.raise_for_status()
            return response.json()
    except Exception as e:
        logger.error(f"Failed to send single notification: {str(e)}")
        return {"error": str(e)}

async def send_student_notification(
    student_id: int,
    event_type: str,
    title: str,
    message: str,
    delivery_modes: List[str] = ["email", "sms", "whatsapp"],
    department: str = "All"
):
    """
    Helper to fetch student details from SIS and send a notification.
    """
    from app.utils.sis_service import SISService
    
    # 1. Fetch student details from SIS
    sis_data = await SISService.get_student_details(student_id)
    
    email = sis_data.get("email_id") or sis_data.get("email")
    if not sis_data or not email:
        logger.warning(f"No email found for student {student_id}, cannot send notification.")
        return {"error": "No email found for student"}

    # 2. Send notification
    return await send_single_notification(
        event_type=event_type,
        title=title,
        message=message,
        recipient_emails=[email],
        delivery_modes=delivery_modes,
        department=department
    )
