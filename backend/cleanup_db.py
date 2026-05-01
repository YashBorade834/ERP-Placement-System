"""
Script to identify and remove duplicate companies from the database
Run this from the backend directory
"""
import sys
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models.company import Company
from app.database import Base

def find_duplicates():
    """Find and display duplicate company names"""
    db = SessionLocal()
    try:
        # Get all companies grouped by name
        from sqlalchemy import func
        duplicates = db.query(
            Company.name, 
            func.count(Company.id).label('count')
        ).group_by(Company.name).having(func.count(Company.id) > 1).all()
        
        if not duplicates:
            print("✅ No duplicate companies found!")
            return None
        
        print("\n🔴 DUPLICATE COMPANIES FOUND:\n")
        print("-" * 80)
        
        all_duplicate_records = []
        for dup_name, count in duplicates:
            print(f"\nCompany: {dup_name} (Found {count} times)")
            print("-" * 80)
            
            records = db.query(Company).filter(Company.name == dup_name).all()
            for i, record in enumerate(records, 1):
                print(f"\n  [{i}] ID: {record.id}")
                print(f"      Name: {record.name}")
                print(f"      Industry: {record.industry}")
                print(f"      Address: {record.address}")
                print(f"      Website: {record.website}")
                print(f"      HR Contact: {record.hr_contact_name}")
                print(f"      HR Email: {record.hr_contact_email}")
                print(f"      HR Phone: {record.hr_contact_phone}")
                print(f"      Approved: {record.is_approved}")
                print(f"      Created: {record.created_at}")
                all_duplicate_records.append((dup_name, record))
        
        return all_duplicate_records
    finally:
        db.close()


def delete_company(company_id):
    """Delete a company by ID"""
    db = SessionLocal()
    try:
        company = db.query(Company).filter(Company.id == company_id).first()
        if not company:
            print(f"❌ Company with ID {company_id} not found!")
            return False
        
        db.delete(company)
        db.commit()
        print(f"✅ Deleted company ID {company_id}: {company.name}")
        return True
    except Exception as e:
        db.rollback()
        print(f"❌ Error deleting company: {e}")
        return False
    finally:
        db.close()


def keep_one_delete_others(company_name, keep_id):
    """Keep one company and delete all others with the same name"""
    db = SessionLocal()
    try:
        records = db.query(Company).filter(Company.name == company_name).all()
        deleted_count = 0
        
        for record in records:
            if record.id != keep_id:
                db.delete(record)
                deleted_count += 1
                print(f"  🗑️  Deleted ID {record.id}")
        
        db.commit()
        print(f"✅ Kept company ID {keep_id}, deleted {deleted_count} duplicates")
        return True
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        return False
    finally:
        db.close()


if __name__ == "__main__":
    print("\n" + "="*80)
    print("DATABASE DUPLICATE COMPANY CLEANUP TOOL")
    print("="*80)
    
    # Find duplicates
    duplicates = find_duplicates()
    
    if duplicates:
        print("\n" + "="*80)
        print("CLEANUP OPTIONS:")
        print("="*80)
        print("\nOption 1: Manual cleanup (edit this script and run again)")
        print("Option 2: Use the cleanup_duplicates() function below")
        print("\nExample to keep ID 1 and delete others with same name:")
        print("  python cleanup_db.py --keep-id 1 --name 'Infosys'")
        print("\n" + "="*80)
        
        # Check if command line args provided
        if len(sys.argv) > 1:
            if sys.argv[1] == "--keep-id" and len(sys.argv) >= 5:
                keep_id = int(sys.argv[2])
                company_name = sys.argv[4]
                keep_one_delete_others(company_name, keep_id)
    else:
        print("\n✅ Database is clean!")
