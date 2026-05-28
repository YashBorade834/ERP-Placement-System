from app.dependencies.auth import get_current_user, require_admin 
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.mou import MOU
from app.schemas.mou import MOUResponse
from app.utils.activity_logger import log_activity
import shutil
import os

# router = APIRouter(prefix="/mou", tags=["MOU"])
router = APIRouter(tags=["MOU"], dependencies=[Depends(require_admin)])

# DB Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ✅ CREATE MOU (File Upload + DB Insert)
@router.post("/", response_model=MOUResponse)
def create_mou(
    company_id: int = Form(...),   # ✅ THIS FIX
    signed_date: str = Form(...),  # ✅ THIS FIX
    file: UploadFile = File(...),
    remarks: str = Form(None),     # ✅ Added remarks Form parameter
    db: Session = Depends(get_db)
):
    # ✅ Step 1: Validate file
    if not file:
        raise HTTPException(status_code=400, detail="File is required")

    # ✅ Step 2: Create folder if not exists
    UPLOAD_DIR = "uploads/mou"
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # ✅ Step 3: Save file
    file_location = f"{UPLOAD_DIR}/{file.filename}"

    try:
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

    # ✅ Step 4: Save in DB
    mou = MOU(
        company_id=company_id,
        file_path=file_location,
        signed_date=signed_date,
        remarks=remarks
    )

    db.add(mou)
    db.commit()
    db.refresh(mou)

    # ✅ Step 5: Activity Log
    log_activity(
        db=db,
        user_id=1,
        table_name="mou",
        record_id=mou.id,
        action_type="CREATE",
        description="MOU created"
    )

    db.commit()

    return mou


# ✅ GET ALL MOU
@router.get("/", response_model=list[MOUResponse])
def get_all_mou(db: Session = Depends(get_db)):
    return db.query(MOU).all()


# ✅ DELETE MOU (Deletes file and DB entry)
@router.delete("/{mou_id}")
def delete_mou(mou_id: int, db: Session = Depends(get_db)):
    mou = db.query(MOU).filter(MOU.id == mou_id).first()

    if not mou:
        raise HTTPException(status_code=404, detail="MOU not found")

    # Delete physical file from disk if it exists
    if mou.file_path and os.path.exists(mou.file_path):
        try:
            os.remove(mou.file_path)
        except Exception as e:
            print(f"Warning: Failed to delete file {mou.file_path}: {e}")

    # Delete from DB
    db.delete(mou)

    # Add Activity Log
    log_activity(
        db=db,
        user_id=1,
        table_name="mou",
        record_id=mou_id,
        action_type="DELETE",
        description=f"MOU ID {mou_id} deleted"
    )

    db.commit()

    return {"message": f"MOU deleted successfully"}