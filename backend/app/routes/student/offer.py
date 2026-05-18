from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.offer import Offer
from app.models.application_status import ApplicationStatus
from app.schemas.offer import OfferCreate, OfferUpdate, OfferResponse, RejectOfferRequest

# router = APIRouter(prefix="/offers", tags=["Offers"])
router = APIRouter(tags=["Offers"])

# CREATE OFFER (with correct validation)
@router.post("/", response_model=OfferResponse)
def create_offer(data: OfferCreate, db: Session = Depends(get_db)):

    # ✅ Get latest status (IMPORTANT FIX)
    latest_status = db.query(ApplicationStatus).filter(
        ApplicationStatus.application_id == data.application_id
    ).order_by(ApplicationStatus.id.desc()).first()

    # ✅ Check latest status
    if not latest_status or latest_status.status != "Selected":
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
    return obj


# GET ALL
@router.get("/", response_model=list[OfferResponse])
def get_all_offers(db: Session = Depends(get_db)):
    return db.query(Offer).all()

# GET BY STUDENT
@router.get("/student/{student_id}", response_model=list[OfferResponse])
def get_my_offers(student_id: int, db: Session = Depends(get_db)):
    """Get all offers for a specific student"""
    from app.models.student_application import StudentApplication
    
    offers = db.query(Offer).join(
        StudentApplication, Offer.application_id == StudentApplication.id
    ).filter(
        StudentApplication.student_id == student_id
    ).all()
    
    return offers


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

# ✅ ACCEPT OFFER
@router.put("/{id}/accept")
def accept_offer(id: int, db: Session = Depends(get_db)):
    offer = db.query(Offer).filter(Offer.id == id).first()

    if not offer:
        raise HTTPException(404, "Offer not found")

    offer.status = "Accepted"
    db.commit()

    return {"message": "Offer accepted"}


# ❌ REJECT OFFER
@router.put("/{id}/reject")
def reject_offer(id: int, data: RejectOfferRequest, db: Session = Depends(get_db)):
    offer = db.query(Offer).filter(Offer.id == id).first()

    if not offer:
        raise HTTPException(404, "Offer not found")

    offer.status = "Rejected"
    offer.reason = data.reason
    db.commit()

    return {"message": "Offer rejected"}


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