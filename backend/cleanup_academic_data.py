#!/usr/bin/env python
import sys
sys.path.insert(0, '.')

from app.database import engine
from app.models.student_academic import StudentAcademic
from sqlalchemy.orm import Session

session = Session(engine)
try:
    # Delete all student academic data
    deleted_count = session.query(StudentAcademic).delete()
    session.commit()
    print(f'✓ Deleted {deleted_count} academic record(s). Students must now fill their data through the dashboard.')
finally:
    session.close()
