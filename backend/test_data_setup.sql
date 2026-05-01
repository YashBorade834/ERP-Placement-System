-- ==========================================
-- TEST DATA SETUP FOR STUDENT DASHBOARD
-- ==========================================
-- This script creates test data so you can test the student dashboard

-- 1. Insert a test company
INSERT INTO companies (name, industry, address, website, hr_contact_name, phone)
VALUES 
  ('Infosys', 'IT Services', 'Pune', 'https://www.infosys.com', 'John Doe', '9876543210'),
  ('TCS', 'IT Services', 'Mumbai', 'https://www.tcs.com', 'Jane Smith', '9876543211');


-- 2. Insert active drives (is_published=true AND is_active=true)
INSERT INTO placement_drives (company_id, title, description, drive_date, venue, is_published, is_active, registration_open)
VALUES 
  (1, 'Java Developer', 'We are hiring Java developers for our Pune office', '2024-06-15', 'Pune', true, true, true),
  (1, 'Python Developer', 'Python backend engineer positions available', '2024-06-20', 'Pune', true, true, true),
  (2, 'DevOps Engineer', 'Cloud infrastructure and DevOps roles', '2024-07-01', 'Mumbai', true, true, true);


-- 3. Insert eligibility rules for drives
-- For Java Developer (drive_id = 1)
INSERT INTO eligibility_rules (drive_id, min_cgpa, max_backlogs, min_backlogs, allowed_branches, gender_restriction, min_batch, max_batch)
VALUES 
  (1, 7.5, 2, 0, 'CSE,IT,ECE', NULL, 2022, 2024),
  (2, 7.0, 3, 0, 'CSE,IT', NULL, 2022, 2024),
  (3, 7.2, 2, 0, 'CSE,IT,ECE', NULL, 2023, 2024);


-- 4. Verify the data
SELECT 'Companies' as section, * FROM companies ORDER BY id DESC LIMIT 2;
SELECT 'Active Drives' as section, id, company_id, title, is_published, is_active FROM placement_drives WHERE is_published=true AND is_active=true;
SELECT 'Eligibility Rules' as section, * FROM eligibility_rules WHERE drive_id IN (1,2,3);
