from fastapi import APIRouter, Depends, HTTPException, status
from app.dependencies.auth import get_current_user

router = APIRouter(tags=["Student Insights"])

@router.get("/", response_model=dict)
async def get_insights(user: dict = Depends(get_current_user)):
    """Return placeholder analytics for the logged‑in student.
    Replace with real analytics logic later.
    """
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Unauthorized")
    return {
        "student_id": user.get("user_id"),
        "message": "Insights data placeholder",
        "statistics": {"applications_submitted": 3, "offers_received": 1},
    }
