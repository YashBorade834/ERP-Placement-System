# from fastapi.statiscfiles import StaticFiles
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
from app.routes.admin.application_status import router as application_status_router
from app.routes.admin.activity_log import router as activity_log_router
from app.routes.admin.mou import router as mou_router
from app.routes.admin.offer import router as offer_router



app = FastAPI(title="College ERP | Placement Module")
# CORS Configuration


# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://localhost:3000"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

allow_credentials=True

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        # "http://localhost:5173",
        # "http://127.0.0.1:5173",
        "https://chivalry-carpentry-dreamless.ngrok-free.dev",
        "https://dollop-trailing-delusion.ngrok-free.dev"
    ],
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
app.include_router(mou_router, prefix="/admin/mou", tags=["MOU"])
app.include_router(offer_router, prefix="/admin/offers", tags=["Offers"])


# Student
app.include_router(application_router, tags=["Student Application"])


@app.get("/")
def root():
    return {"message": "ERP Placement Backend is running"}