import asyncio
import sys
from app.services.sis_client import SISClient

async def check_student(student_id: int):
    client = SISClient()
    result = await client.get_student_details(student_id)
    if result:
        print(f"Student {student_id} found in SIS.")
    else:
        print(f"Student {student_id} NOT found in SIS.")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python check_student.py <student_id>")
        sys.exit(1)
    try:
        sid = int(sys.argv[1])
    except ValueError:
        print("Student ID must be an integer.")
        sys.exit(1)
    asyncio.run(check_student(sid))
