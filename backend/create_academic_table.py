from app.database import engine, Base
from app.models.student_academic import StudentAcademic

# This will create the student_academics table if it doesn't exist
Base.metadata.create_all(bind=engine)
print("Tables created successfully!")
