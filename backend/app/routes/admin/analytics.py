from fastapi import APIRouter, Depends
from app.dependencies.auth import get_current_user, require_admin 
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.company import Company
from app.models.drive import PlacementDrive
from app.models.student_application import StudentApplication

router = APIRouter(prefix="/admin/analytics", tags=["Analytics"], dependencies=[Depends(require_admin )])

@router.get("/summary")
def get_analytics_summary(db: Session = Depends(get_db)):
    # 1. Companies by Industry
    industry_stats = db.query(
        Company.industry, 
        func.count(Company.id)
    ).group_by(Company.industry).all()
    
    # 2. Application Status Stats
    app_stats = db.query(
        StudentApplication.application_status, 
        func.count(StudentApplication.id)
    ).group_by(StudentApplication.application_status).all()
    
    # 3. Monthly Drives (Postgres compatible)
    drive_stats = db.query(
        func.to_char(PlacementDrive.drive_date, 'YYYY-MM').label('month'),
        func.count(PlacementDrive.id)
    ).filter(PlacementDrive.drive_date != None).group_by('month').order_by('month').all()

    return {
        "industries": [{"name": i or "Other", "value": c} for i, c in industry_stats],
        "applications": [{"status": s, "count": c} for s, c in app_stats],
        "monthly_drives": [{"month": m, "count": c} for m, c in drive_stats]
    }
