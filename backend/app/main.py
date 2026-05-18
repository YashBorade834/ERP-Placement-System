from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
# from app.routes.admin import company, drive
from app.routes.admin.company import router as company_router
from app.routes.admin.drive import router as drive_router
from app.routes.admin.eligibility import router as eligibility_router
from app.routes.admin.workflow import router as workflow_router
from app.routes.admin.drive_round import router as drive_round_router
from app.routes.student.application import router as application_router
from app.routes.student.resume import router as resume_router
from app.routes.student.academic import router as academic_router
from app.routes.admin.application_status import router as application_status_router
from app.routes.admin.activity_log import router as activity_log_router
from app.routes.admin.mou import router as mou_router
from app.routes.admin.offer import router as admin_offer_router
from app.routes.student.offer import router as student_offer_router
from app.routes.admin.analytics import router as analytics_router



app = FastAPI(title="College ERP | Placement Module")

# Mount static files for resume downloads
import os
if not os.path.exists("uploads"):
    os.makedirs("uploads")
    
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
# CORS Configuration


# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://localhost:3000"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://.*\.ngrok-free\.dev|https?://localhost:\d+|https?://127\.0\.0\.1:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Admin
app.include_router(company_router, prefix="/admin/company")
app.include_router(drive_router, prefix="/admin/drive")
app.include_router(eligibility_router, prefix="/admin/eligibility", tags=["Eligibility"])
app.include_router(workflow_router, prefix="/admin/workflow", tags=["Workflow"])
app.include_router(drive_round_router, prefix="/admin/rounds", tags=["Drive Rounds"])
app.include_router(application_status_router, prefix="/admin/application", tags=["Application Status"])
app.include_router(activity_log_router, prefix="/admin/activity-log", tags=["Activity Log"])
app.include_router(mou_router, prefix="/admin/mou", tags=["Activity Log"])
app.include_router(admin_offer_router, prefix="/admin/offer", tags=["Offers"])
app.include_router(analytics_router, tags=["Analytics"])


# Student
app.include_router(application_router, tags=["Student Application"])
app.include_router(resume_router, tags=["Student Resume"])
app.include_router(academic_router, tags=["Student Academic"])
app.include_router(student_offer_router, prefix="/student/offer", tags=["Student Offer"])


@app.get("/")
def root():
    return {"message": "ERP Placement Backend is running"}