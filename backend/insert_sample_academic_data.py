#!/usr/bin/env python
import sys
sys.path.insert(0, '.')

from app.database import engine
from app.models.student_academic import StudentAcademic
from sqlalchemy.orm import Session

session = Session(engine)
try:
    existing = session.query(StudentAcademic).filter(StudentAcademic.student_id == 1).first()
    if not existing:
        academic = StudentAcademic(
            student_id=1,
            cgpa=7.0,
            current_backlogs=0,
            history_backlogs=0,
            tenth_marks=85.5,
            twelfth_marks=88.0,
            diploma_marks=None
        )
        session.add(academic)
        session.commit()
        print('✓ Sample academic data added for student 1')
    else:
        existing.cgpa = 7.0
        session.commit()
        print('✓ Academic data updated for student 1 (CGPA: 7.0)')
finally:
    session.close()
