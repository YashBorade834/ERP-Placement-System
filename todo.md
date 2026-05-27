# Placement Module — TODO

Your module owns placement drives, applications, and offers. ⚠️ **Your module has the most integration gaps in the system** — you currently operate as an island. See `docs/PROJECT_CONTEXT.md`.

## 🔴 Red — Project Hygiene (Common Standards — do first)

These items are **the same for every module**. See `docs/PROJECT_CONTEXT.md` for full specs.

### H1. Adopt the canonical folder structure
**Why:** You have 5 markdown guides, a typo file (`Ngrok guid.txt`), and image/PDF binaries all at the root. Frontend dir is named `placement-frontend/` instead of `frontend/`.
**Change for this module:**
- **Move to `docs/`:** `ADMIN_STATUS_MANAGEMENT_COMPLETE.md`, `DRIVE_CREATION_GUIDE.md`, `FIXES_AND_TESTING_GUIDE.md`, `FRONTEND_BACKEND_FIXES.md`, `STUDENT_DASHBOARD_GUIDE.md`.
- **Move to `docs/assets/`:** `database.pdf`, `pgsql_erd.png`.
- **`Ngrok guid.txt`** (note the typo) → rename + move to `docs/setup-ngrok.md`. Or delete if obsolete after `run.sh` handles tunnels.
- **Rename `placement-frontend/`** → `frontend/`.
- **Verify `backend/` and `frontend/` internals** match canonical sub-structure.
- After cleanup, root contains ONLY: `README.md`, `run.sh`, `run.ps1`, `.env.example`, `.gitignore`, `docs/`, `backend/`, `frontend/`.

### H2. Add `run.sh` and `run.ps1`
**Why:** No setup script today; multiple ngrok URLs hardcoded.
**Change:**
- `run.sh` + `run.ps1` at repo root — contract in `docs/PROJECT_CONTEXT.md`.
- Must: check Python 3.10+, Node 18+, Postgres 14+; venv; pip install; npm install; copy `.env.example`→`.env`; `alembic upgrade head`; start backend on **port 8007** + frontend on **port 5179**.

### H3. Frontend AuthGate — verify every page render
**Why:** You have **zero auth** today. Both student portal and admin TPO portal are open. AuthGate is the entry point.
**Change:**
- `frontend/src/auth/AuthGate.jsx` (new) — wraps router. On mount + route change: `GET /api/auth/me` on your own backend. 401 → redirect to `${VITE_AUTH_URL}/login?redirect=<current>`. 200 → context.
- `frontend/src/api/client.js` (new) — replace per-resource API files (`companyApi.js`, `driveApi.js`, etc.) with a single axios instance + auth interceptor. Keep the resource-method modules but have them import from `client.js`.
- `backend/app/api/v1/auth.py` → `GET /api/auth/me`.
- **Per-route role gating:**
  - `/student/*` → `<AuthGate allowedRoles={['Student']}>` AND check `current_user.user_id` matches the student in the URL.
  - `/admin/*` → `<AuthGate allowedRoles={['TPO','admin']}>`.
- The dummy student (Module-Specific #1 below) goes away once you can read `current_user.user_id` from JWT and fetch from SIS.

### H4. Handle every role explicitly (TPO is your primary role)
**Why:** Placement has clear role distinctions: TPO administers, Students apply, hod/principal review dept stats, others see nothing. Today you have zero role gating — that's a critical fix on top of zero auth (your Module-Specific #2 below).
**Change:**
- `backend/app/core/roles.py` (new) — mirror Auth's `/api/roles/catalog`.
- `backend/app/dependencies/auth.py` — `require_roles(*allowed)` Depends.
- **Self-only enforcement:** Student endpoints must check `application.student_id == current_user.user_id`.
- **TPO scoping:** TPO is institute-wide (not dept-scoped). Full CRUD.
- **HOD scoping:** HOD reads stats for own dept only.
- `frontend/src/pages/AccessDenied.jsx` (new) — see context.md.

**This module's role matrix:**

| Role | Access in Placement |
|---|---|
| Student | `GET /student/drives` (filtered by own eligibility), `POST /student/apply`, `GET /student/applications/{my-id}`, `PUT /student/application/{id}/withdraw`, `GET /student/offer/{my-application-id}` |
| Guest | 403 (must be enrolled to apply) |
| admin | Full read on all admin endpoints; can override TPO decisions; manage MOUs |
| principal | Same as admin |
| vice_principal | Same as admin |
| hod | Read-only dept placement stats (`GET /admin/applications?department=<own-dept>`, `GET /admin/stats?department=<own-dept>`); 403 on writes |
| accountant | 403 |
| TPO | **Primary role** — full CRUD on companies, drives, eligibility, workflows, rounds, applications, offers, MOUs, activity logs |
| Faculty *(pending)* | Read-only on drives + dept-level application stats |

### H5. Naming consistency (rename to canonical)
**Why:** Your status enums are all UPPERCASE (`APPLIED`, `SHORTLISTED`) — the system standard is lowercase snake. Your frontend dir is custom-named. See full naming rules in `docs/PROJECT_CONTEXT.md`.

**Filename + folder-name conventions — audit the WHOLE repo, not just the renames below.** This is the *same principle every module follows*; full table in the "Naming conventions" section of `docs/PROJECT_CONTEXT.md`. Walk the tree file-by-file and rename anything that doesn't match:
- **Folders:** all lowercase, **no spaces** — `backend/`, `frontend/`, `docs/` (never `sis-frontend/`, `placement-frontend/`, `Requirement Documents/`). Python packages `snake_case`. No double-nested same-name folders (`x/x/`).
- **Python files:** `snake_case.py` (e.g. `student_service.py`); classes inside are `PascalCase`.
- **React components:** `PascalCase.jsx`/`.tsx` (e.g. `AuthGate.jsx`). **JS utilities:** `camelCase.js` (e.g. `formatDate.js`). **Config files:** lowercase (`vite.config.js`, `tailwind.config.js`).
- **Test files:** `test_<unit>.py` (Python) / `<Component>.test.tsx` (JS).
- **Same concept = same name everywhere** at the wire: `student_id` (never `studentId`/`sid`), `user_id`, `department_id`. DB column name = API JSON key, both `snake_case`.

**Renames to apply:**

| Current | Target | Notes |
|---|---|---|
| **Repo:** `ERP-Placement-System` | `pvg-placement` | Drop UPPER-case + `-System` suffix |
| **Folder:** `placement-frontend/` | `frontend/` | (already in H1) |
| `ApplicationStatus.application_status` values: `'APPLIED'`, `'SHORTLISTED'`, `'SELECTED'`, `'REJECTED'`, `'WITHDRAWN'` | `'applied'`, `'shortlisted'`, `'selected'`, `'rejected'`, `'withdrawn'` | Lowercase snake |
| `StudentApplication.application_status` (field on parent) | (probably duplicates `ApplicationStatus` table — pick one as source of truth, drop the other) | Module-Specific has a related item about latest-status; while you're there, drop duplicate field |
| `PlacementDrive.title` | (keep) | ✓ |
| `PlacementDrive.drive_date` | (keep — `_date` suffix is correct for date-only) | ✓ |
| `PlacementDrive.publish` | `is_published` (with `is_` prefix) | Boolean convention |
| `PlacementDrive.active` | `is_active` | Same |
| `Company.is_approved` | (keep) | ✓ already correct |
| `EligibilityRule.allowed_branches` (string list?) | (audit format — should be `department_ids` list of ints, not string slugs) | FKs to `departments` |
| `EligibilityRule.gender` (with allowed values?) | document the enum values; lowercase snake (`male`, `female`, `any`) | |
| `StudentApplication.student_id` | (keep — canonical, queries SIS per Module-Specific #1) | ✓ |
| `DriveRound.round_name`, `round_number`, `mode` | `mode` values lowercase snake: `online`, `onsite`, `hybrid` | |
| `Offer.position`, `package` | (keep — descriptive) | `package` should be `package_lpa` if it's lakhs-per-annum, document units |
| `MOU` table | `mous` table (plural) | |
| `Workflow.total_rounds` | (keep) | ✓ |

**API endpoint paths to align:**
- `/admin/*` and `/student/*` → `/api/v1/admin/*` and `/api/v1/student/*` (or better: drop the role-named prefix entirely and gate via `require_roles()` — keeps URLs role-agnostic).
- `/{application_id}/status`, `/{application_id}/shortlist|select|reject` (at root!) → `/api/v1/applications/{application_id}/status`, `/applications/{application_id}/shortlist`, etc.
- `/admin/drive/` (singular) → `/api/v1/placement-drives/` (plural, descriptive).
- `/admin/company/` → `/api/v1/companies/`.
- `/admin/eligibility/` → `/api/v1/placement-drives/{drive_id}/eligibility/` (nest under drive).

**Env vars to standardize:**
- `PLACEMENT_PORT=8007`
- `DATABASE_URL`
- `JWT_SECRET`
- `AUTH_URL`, `SIS_URL`, `FEES_URL`, `NOTIFY_URL`, `ACADEMIC_URL`
- `NOTIFY_API_KEY` = `PLACE_KEY_2026`
- `VITE_API_URL`, `VITE_AUTH_URL` (frontend)

### H6. Code quality bar (lint, type-check, test)
**Why:** Multi-step drive creation + eligibility computation + status workflow = many code paths. Without tests, regressions destroy student trust ("I was eligible yesterday, today I'm not").
**Change:**
- `.pre-commit-config.yaml` — `black`, `ruff`, `prettier`, `eslint`.
- `backend/pyproject.toml` — `ruff` + `mypy --strict` + `pytest --cov` ≥ 70%.
- `frontend/.eslintrc.cjs`.
- `.editorconfig`.
- `.github/workflows/ci.yml`.
- **Property-based tests** for eligibility logic — `hypothesis` to generate random student profiles + rules.

### H7. Observability (health, logging, request IDs)
**Why:** Placement decisions are emotional + legally consequential. When a student claims they were unfairly rejected, you need an audit trail.
**Change:**
- `GET /healthz`, `GET /readyz`.
- **Structured JSON logging** — every status change logs: `{application_id, from_status, to_status, by_user_id, request_id, drive_round_id, remarks}`.
- **Request ID middleware** + propagation on outbound calls to SIS (eligibility data), Notify, Auth.
- **Sentry stub.**
- **ActivityLog dependency** — finally write to it consistently (Module-Specific #8); every mutating endpoint writes a row with request_id.

### H8. Student data shared with companies (consent + privacy)
**Why:** When students apply to a drive, you may share resume / contact / academic data with the company. DPDP Act 2023 requires explicit consent for sharing PII with third parties; failure is a regulatory + reputational risk.
**Change:**
- Add `StudentApplication.consent_given` (bool) + `consent_given_at` (timestamp) + `consent_fields` (JSON array of what fields were shared).
- Pre-application flow: show the student exactly which fields go to the company (name, email, phone, CGPA, resume URL, etc.) and capture consent. Block submission if not given.
- `docs/data-sharing-policy.md` — document what fields go to which party (company contact, TPO admin, HR external systems), retention, withdrawal flow.
- Withdraw consent: when student withdraws application, remove their record from company-facing views; data retained internally for audit but flagged `consent_withdrawn=true`.
- Right-to-be-forgotten endpoint: `POST /api/v1/admin/student-data-erasure/{student_id}` — admin-only; anonymizes withdrawn records.

---

## 🔴 Red — Module-Specific (do after hygiene)

### 1. Remove the dummy student — wire to SIS
**Why:** Today your code hardcodes `student_id=1, CGPA 8.0, branch=CSE, batch=2023`. Every student appears the same. Eligibility checks are meaningless.
**Change:**
- `backend/app/services/student_service.py` (new) — `get_student(student_id)` calls `GET <SIS_URL>/api/v1/students/{student_id}` and returns `{cgpa, branch, batch, backlogs, gender}` from SIS's response.
- `backend/app/routes/student/application.py` — `POST /student/apply` and `POST /student/check-eligibility` must take `student_id` from the JWT (not URL), then fetch profile from SIS.
- Remove the dummy fallback. Don't allow eligibility check without a real SIS student.
- `.env.example` — add `SIS_URL=http://localhost:8001` (or wherever).

### 2. Apply JWT auth to all routes
**Why:** No auth anywhere. Anyone can create drives, approve companies, issue offer letters.
**Change:**
- `backend/app/dependencies/auth.py` (new) — JWT verification dep using shared `SECRET_KEY`.
- Apply to every router:
  - `/admin/*` → require `role == 'TPO'` or `role == 'admin'`
  - `/student/*` → require `role == 'Student'` AND `student_id` from JWT matches the path/body.
- Files: `backend/app/main.py` add global dependency or apply per-router.

### 3. Add `college-erp-theme` and adopt tokens
**Why:** **You're the only frontend with zero theme usage.** UI looks different from every other module. Hardcoded TailwindCSS colors everywhere.
**Change:**
- `placement-frontend/package.json` — add `"college-erp-theme": "^1.1.0"`.
- `placement-frontend/src/index.css` — `@import 'college-erp-theme/dist/theme.css';`.
- `placement-frontend/tailwind.config.js` — extend `theme.colors` to reference `var(--erp-*)` tokens.
- Replace `bg-blue-500`, `text-gray-700`, etc. across all pages with theme-mapped Tailwind classes (`bg-primary`, `text-base`).

### 4. Replace hardcoded ngrok URLs
**Why:** Your README / config mentions `chivalry-carpentry-dreamless.ngrok-free.dev` and `dollop-trailing-delusion.ngrok-free.dev`. Will break on ngrok rotation.
**Change:**
- Backend: read `FRONTEND_URL` from env for CORS.
- Frontend: read `VITE_BACKEND_URL` from `import.meta.env`. Add to `.env.example`.

## 🟠 Orange — Important

### 5. Use Fees module for application fees / placement payments (if applicable)
**Why:** If you ever charge students for placement registration or companies for posting drives — that must go through Fees module.
**Change:** Currently you have no payments. If/when you add them, call `POST <FEES_URL>/api/v1/bills/create` with `bill_type=placement-app` and your `PLACE_KEY_2026` for any reference.

### 6. Send notifications via Notify module
**Why:** Today no notifications fire on drive announcements, shortlisting, selection. Students miss opportunities.
**Change:**
- `backend/app/services/notify.py` (new) — call `POST <NOTIFY_URL>/api/module-notification` with `PLACE_KEY_2026`.
- Fire on: drive published (recipient_roles=['Student']+department filter), status changed to SHORTLISTED/SELECTED/REJECTED (recipient_emails=[student.email from SIS]), offer issued.

### 7. File storage for circulars, offer letters, MOUs
**Why:** Today `circular_file_path`, `offer_letter_path`, `mou_file_path` are placeholder strings. The files don't actually exist.
**Change:**
- Use S3-compatible storage (or coordinate with Admission if they implement it first).
- `backend/app/api/files.py` (new) — presigned upload URL endpoint for admin uploads; presigned read URL for students viewing their offer.

### 8. ActivityLog — actually write to it
**Why:** Model exists but routes don't consistently log activity.
**Change:** `backend/app/middleware/activity_logger.py` (new) — middleware that logs every mutating request with user, action, target. Remove ad-hoc audit code.

### 9. Company approval workflow
**Why:** `Company.is_approved` flag exists but the admin UI to approve is unclear.
**Change:** `placement-frontend/src/pages/admin/Companies.jsx` — add Approve/Reject buttons + a pending-companies tab.

## 🟡 Yellow — Polish

### 10. Align FastAPI version
**Why:** Currently unpinned (`fastapi` without version). Pin to `fastapi==0.135.2`.
**Change:** `backend/requirements.txt`.

### 11. Eligibility rules — extend to use historical SIS data
**Why:** Once wired to SIS, you can do richer eligibility (e.g., "no failed semester in last 2 years"). Today only spot-check.
**Change:** `backend/app/services/eligibility_service.py` — extend to call SIS for academic history.

### 12. Admin drive-creation flow — break the multi-step into pages
**Why:** `frontend/src/pages/admin/Drives.jsx` has 4 collapsible sections in one screen. Hard to navigate.
**Change:** Convert to a wizard: `/admin/drives/new/details` → `/eligibility` → `/workflow` → `/rounds`.

### 13. Student application — link "My Applications" to SIS profile
**Why:** Today student dashboard shows only their applications. They should also see their SIS profile (read-only) to verify eligibility data is current.
**Change:** `placement-frontend/src/pages/student/Dashboard.jsx` — add a "My Profile (from SIS)" panel.
