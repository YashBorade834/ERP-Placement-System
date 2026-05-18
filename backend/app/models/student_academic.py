from sqlalchemy import Column, Integer, Float, DateTime, String
from sqlalchemy.sql import func
from app.database import Base

class StudentAcademic(Base):
    __tablename__ = "student_academics"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, unique=True, index=True, nullable=False)
    
    cgpa = Column(Float, nullable=True)
    current_backlogs = Column(Integer, default=0)
    history_backlogs = Column(Integer, default=0)
    
    tenth_marks = Column(Float, nullable=True)
    twelfth_marks = Column(Float, nullable=True)
    diploma_marks = Column(Float, nullable=True)
    
    batch_year = Column(Integer, nullable=True)
    gender = Column(String(20), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
