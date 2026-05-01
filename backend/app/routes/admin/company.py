from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.company import Company
from app.schemas.company import CompanyCreate, CompanyResponse, CompanyUpdate

router = APIRouter(tags=["Admin - Company"])


# DB Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ➕ Add Company
@router.post("/", response_model=CompanyResponse)
def add_company(data: CompanyCreate, db: Session = Depends(get_db)):
    company = Company(**data.dict())
    db.add(company)
    db.commit()
    db.refresh(company)
    return company




# 📛 Get Only Names
@router.get("/names")
def get_company_names(db: Session = Depends(get_db)):
    companies = db.query(Company.name).all()
    return [company[0] for company in companies]


# 🔍 Search Company
@router.get("/search/{company_name}", response_model=list[CompanyResponse])
def search_company_by_name(company_name: str, db: Session = Depends(get_db)):
    companies = db.query(Company).filter(
        Company.name.ilike(f"%{company_name}%")
    ).all()

    if not companies:
        raise HTTPException(status_code=404, detail="Company not found")

    return companies


# 📄 View All Companies
@router.get("/", response_model=list[CompanyResponse])
def view_companies(db: Session = Depends(get_db)):
    return db.query(Company).all()


# ✏️ Update Company
@router.put("/{company_id}", response_model=CompanyResponse)
def update_company(company_id: int, data: CompanyUpdate, db: Session = Depends(get_db)):
    company = db.query(Company).filter(Company.id == company_id).first()

    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(company, key, value)

    db.commit()
    db.refresh(company)
    return company


# 🗑️ Delete Company
@router.delete("/{company_id}")
def delete_company(company_id: int, db: Session = Depends(get_db)):
    company = db.query(Company).filter(Company.id == company_id).first()

    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    company_name = company.name
    db.delete(company)
    db.commit()
    return {"message": f"Company '{company_name}' deleted successfully"}