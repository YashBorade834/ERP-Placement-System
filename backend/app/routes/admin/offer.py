from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from app.dependencies.auth import get_current_user, require_admin 
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from app.database import get_db
from app.models.offer import Offer
from app.models.application_status import ApplicationStatus
from app.models.student_application import StudentApplication
from app.models.drive import PlacementDrive
from app.models.company import Company
from app.models.application_status import ApplicationStatusEnum
from app.schemas.offer import OfferCreate, OfferUpdate, OfferResponse
from datetime import date
from pydantic import BaseModel

router = APIRouter(tags=["Offers"], dependencies=[Depends(require_admin)])

# Schema for release offers request
class ReleaseOffersRequest(BaseModel):
    drive_id: int
    offer_date: date
    offers: list[dict]  # List of {application_id, position, package, offer_letter_path}


#  GET DRIVES WITH SELECTED APPLICATIONS
@router.get("/drives/with-selected-students", response_model=list[dict])
def get_drives_with_selected_students(db: Session = Depends(get_db)):
    """Get all drives that have applications with 'Selected' status in all rounds"""
    
    # Get all applications with selected status grouped by drive
    selected_apps = db.query(
        StudentApplication.drive_id,
        PlacementDrive.title,
        PlacementDrive.package,
        Company.name.label("company_name"),
        Company.industry,
        Company.address,
        func.count(func.distinct(StudentApplication.id)).label("selected_count")
    ).join(
        ApplicationStatus, ApplicationStatus.application_id == StudentApplication.id
    ).join(
        PlacementDrive, PlacementDrive.id == StudentApplication.drive_id
    ).join(
        Company, Company.id == PlacementDrive.company_id
    ).filter(
        ApplicationStatus.status == ApplicationStatusEnum.selected
    ).group_by(
        StudentApplication.drive_id,
        PlacementDrive.title,
        PlacementDrive.package,
        Company.name,
        Company.industry,
        Company.address
    ).all()
    
    result = []
    for app in selected_apps:
        result.append({
            "drive_id": app.drive_id,
            "title": app.title,
            "package": app.package,
            "company_name": app.company_name,
            "company_industry": app.industry,
            "company_address": app.address,
            "selected_count": app.selected_count
        })
    
    return result


#  GET SELECTED STUDENTS FOR A DRIVE
@router.get("/drives/{drive_id}/selected-students", response_model=list[dict])
async def get_selected_students_for_drive(drive_id: int, db: Session = Depends(get_db)):
    """Get all selected students for a specific drive"""
    
    selected_apps = db.query(
        StudentApplication.id.label("application_id"),
        StudentApplication.student_id,
        ApplicationStatus.status
    ).join(
        ApplicationStatus, ApplicationStatus.application_id == StudentApplication.id
    ).filter(
        and_(
            StudentApplication.drive_id == drive_id,
            ApplicationStatus.status == ApplicationStatusEnum.selected
        )
    ).distinct().all()
    
    result = []
    from app.services.sis_client import SISClient
    
    for app in selected_apps:
        # Fetch student name from SIS
        student_name = "Student " + str(app.student_id)
        try:
            sis_data = await SISClient().get_student_details(app.student_id)
            if sis_data:
                student_name = f"{sis_data.get('first_name', '')} {sis_data.get('last_name', '')}".strip() or student_name
        except Exception as e:
            print(f"Error fetching student name for offer management: {e}")

        result.append({
            "application_id": app.application_id,
            "student_id": app.student_id,
            "student_name": student_name,
            "status": app.status
        })
    
    return result


#  RELEASE OFFERS FOR A DRIVE
@router.post("/release-offers")
def release_offers(data: ReleaseOffersRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Release offers for all selected students in a drive"""
    
    drive = db.query(PlacementDrive).filter(PlacementDrive.id == data.drive_id).first()
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")
    
    created_offers = []
    errors = []
    
    for offer_data in data.offers:
        try:
            application_id = offer_data.get("application_id")
            position = offer_data.get("position")
            package = offer_data.get("package")
            offer_letter_path = offer_data.get("offer_letter_path", "")
            
            # Check if application exists and is selected
            app = db.query(StudentApplication).filter(
                StudentApplication.id == application_id
            ).first()
            
            if not app:
                errors.append(f"Application {application_id} not found")
                continue
            
            # Check if application is selected
            latest_status = db.query(ApplicationStatus).filter(
                ApplicationStatus.application_id == application_id
            ).order_by(ApplicationStatus.id.desc()).first()
            
            if not latest_status or latest_status.status != ApplicationStatusEnum.selected:
                errors.append(f"Application {application_id} is not in selected status")
                continue
            
            # Check if offer already exists
            existing_offer = db.query(Offer).filter(
                Offer.application_id == application_id
            ).first()
            
            if existing_offer:
                errors.append(f"Offer already exists for application {application_id}")
                continue
            
            # Create offer
            offer = Offer(
                application_id=application_id,
                offer_letter_path=offer_letter_path,
                offer_date=data.offer_date,
                position=position,
                package=package,
                status="Pending"  # Status is Pending until student accepts/rejects
            )
            db.add(offer)
            db.commit()
            db.refresh(offer)
            created_offers.append(offer)
            
            # Trigger Notification
            from app.utils.notification import send_student_notification
            company = db.query(Company).filter(Company.id == drive.company_id).first()
            company_name = company.name if company else drive.title
            
            background_tasks.add_task(
                send_student_notification,
                student_id=app.student_id,
                event_type="Placement Offer Released",
                title="Congratulations! You have been selected",
                message=f"Congratulations! You have been selected for the position of {position} at {company_name} Please log in to the College Portal and view your further Details.",
                delivery_modes=["email"],
                department="All"
            )
            
        except Exception as e:
            errors.append(f"Error creating offer: {str(e)}")
    
    return {
        "message": f"Created {len(created_offers)} offers",
        "created_count": len(created_offers),
        "errors": errors
    }


@router.post("/", response_model=OfferResponse)
def create_offer(data: OfferCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):

    # ✅ Get latest status (IMPORTANT FIX)
    latest_status = db.query(ApplicationStatus).filter(
        ApplicationStatus.application_id == data.application_id
    ).order_by(ApplicationStatus.id.desc()).first()

    # ✅ Check latest status
    if not latest_status or latest_status.status != ApplicationStatusEnum.selected:
        raise HTTPException(
            status_code=400,
            detail="Offer can only be given to selected students"
        )

    # 🔥 OPTIONAL (recommended): prevent multiple offers
    existing_offer = db.query(Offer).filter(
        Offer.application_id == data.application_id
    ).first()

    if existing_offer:
        raise HTTPException(
            status_code=400,
            detail="Offer already exists for this application"
        )

    # ✅ Create offer
    obj = Offer(**data.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    
    # Trigger Notification
    try:
        app = db.query(StudentApplication).filter(StudentApplication.id == data.application_id).first()
        if app:
            drive = db.query(PlacementDrive).filter(PlacementDrive.id == app.drive_id).first()
            drive_title = drive.title if drive else "Placement Drive"
            company = db.query(Company).filter(Company.id == drive.company_id).first() if drive else None
            company_name = company.name if company else drive_title
            
            from app.utils.notification import send_student_notification
            background_tasks.add_task(
                send_student_notification,
                student_id=app.student_id,
                event_type="Placement Offer Released",
                title="Congratulations! You have been selected",
                message=f"Congratulations! You have been selected at {company_name} Please log in to the College Portal and view your further Details.",
                delivery_modes=["email"],
                department="All"
            )
    except Exception as e:
        pass
        
    return obj


# GET ALL
@router.get("/", response_model=list[OfferResponse])
def get_all_offers(db: Session = Depends(get_db)):
    return db.query(Offer).all()


# GET BY ID
@router.get("/{id}", response_model=OfferResponse)
def get_offer(id: int, db: Session = Depends(get_db)):
    obj = db.query(Offer).filter(Offer.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Offer not found")
    return obj


# GET BY APPLICATION
@router.get("/application/{application_id}", response_model=OfferResponse)
def get_offer_by_application(application_id: int, db: Session = Depends(get_db)):
    obj = db.query(Offer).filter(
        Offer.application_id == application_id
    ).first()

    if not obj:
        raise HTTPException(status_code=404, detail="Offer not found")

    return obj



# UPDATE
@router.put("/{id}", response_model=OfferResponse)
def update_offer(id: int, data: OfferUpdate, db: Session = Depends(get_db)):
    obj = db.query(Offer).filter(Offer.id == id).first()

    if not obj:
        raise HTTPException(status_code=404, detail="Offer not found")

    for key, value in data.dict(exclude_unset=True).items():
        setattr(obj, key, value)

    db.commit()
    db.refresh(obj)
    return obj


# DELETE
@router.delete("/{id}")
def delete_offer(id: int, db: Session = Depends(get_db)):
    obj = db.query(Offer).filter(Offer.id == id).first()

    if not obj:
        raise HTTPException(status_code=404, detail="Offer not found")

    db.delete(obj)
    db.commit()
    return {"message": "Deleted successfully"}