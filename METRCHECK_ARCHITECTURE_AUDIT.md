# MetrCheck AI — Architecture Audit & Technical Data-Flow Report
**National Hackathon 6.0 | Problem Statement 26034**  
**Role:** Senior Software Architect  
**Audit Scope:** Full repository technical architecture, end-to-end execution data flow, persistence schemas, multi-tenant security model, and API inventory.  
**Mode:** Read-Only Audit & Verified Grounding  

---

## 1. Executive Summary & System Overview

**MetrCheck AI** is an AI-assisted computer vision and statutory packaging compliance platform built to verify packaged commodities against:
1. **Legal Metrology (Packaged Commodities) Rules, 2011** (Rules 6, 7, 8, 9, 10, 12, 14, 18, 23).
2. **FSSAI (Labelling & Display) Regulations, 2020** (Regulations 5(1), 5(2), 5(3), 5(4), 5(5)).
3. **Legal Metrology Act, 2009** (Sections 18 & 36 statutory penalty framework).

The platform operates across four specialized persona workspaces (**Consumer**, **Brand / Merchant**, **Quality & Audit Inspector**, and **Enforcement Official**), supporting multi-panel packaging scans (1–4 image panels: Front, Back, Side 1, Side 2), real-time PaddleOCR / computer-vision symbol detection, rule-based statutory scoring, explainable bounding-box visual proof, tamper-evident cryptographic hash auditing, and multi-format reporting (PDF, Excel, CSV, JSON).

```mermaid
flowchart TB
    subgraph Frontend["Frontend (React 18 + TypeScript + Vite + TailwindCSS)"]
        UI_Analyze["Analyze.tsx (Upload / Camera / Sample Handoff)"]
        UI_Results["Results.tsx & ResultsHeader.tsx"]
        UI_Evidence["EvidenceViewer.tsx (Canvas Bounding Boxes)"]
        UI_Workspaces["WorkspaceContext (USER / MERCHANT / AUDIT / ENFORCEMENT)"]
        UI_API["services/api.ts (Fetch Client + Ticket Generator)"]
    end

    subgraph Backend_Gateway["FastAPI Application Gateway (backend/main.py)"]
        MW_Sec["Security Headers Middleware (CSP, X-Frame-Options, HSTS)"]
        MW_CORS["CORSMiddleware (Origin Whitelist)"]
        MW_Rate["Distributed Rate Limiting (rate_limit_events)"]
        Auth_Guard["Auth & Tenant Isolation (auth/security.py)"]
    end

    subgraph Core_Pipeline["Asynchronous Analysis Pipeline (backend/services/analysis_service.py)"]
        direction TB
        P1["Phase 1: File Validation & Storage (utils/file_validation.py, services/image_service.py)"]
        P2["Phase 2: Image Quality & Preprocessing (ocr/quality.py, vision/preprocessing.py)"]
        P3["Phase 3: Parallel PaddleOCR Extraction (ocr/paddle_engine.py)"]
        P4["Phase 4: Computer Vision Pipeline (vision/pipeline.py - QR, Barcode, Veg/NonVeg)"]
        P5["Phase 5: Structured Entity Extraction (extraction/llm_extractor.py, compliance/extractor.py)"]
        P6["Phase 6: Statutory Compliance Engine (compliance/engine.py, compliance/rules/*)"]
        P7["Phase 7: Physical Calibration & Rule 12 Font Analysis (compliance/rules/legal_metrology.py)"]
        P8["Phase 8: External Verifications & Cross-Checking (integrations/gs1, integrations/fssai)"]
        P9["Phase 9: Cryptographic Hashing & Integrity (services/integrity_service.py)"]
        P10["Phase 10: Asynchronous DB Persistence & Review Ingestion (database/db.py)"]
    end

    subgraph Storage_Layer["Persistence & Storage Layer"]
        DB_SQLite[("SQLite (WAL Mode) - metrcheck.db")]
        FS_Uploads[("File System - uploads/")]
        CACHE_Table[("verification_cache & rate_limit_events")]
        AUDIT_Chain[("security_audit_logs (SHA-256 Cryptographic Chain)")]
    end

    subgraph Output_Services["Reporting & Action Services"]
        SRV_Report["Report Service (services/report_service.py - ReportLab PDF)"]
        SRV_Review["Officer Review Service (services/review_service.py)"]
        SRV_Enforce["Enforcement Case Service (services/enforcement_service.py)"]
    end

    UI_Analyze -->|POST /api/analyze multipart| Backend_Gateway
    Backend_Gateway --> MW_Sec --> MW_CORS --> MW_Rate --> Auth_Guard
    Auth_Guard --> Core_Pipeline
    Core_Pipeline --> Storage_Layer
    Storage_Layer --> Output_Services
    Output_Services -->|PDF / JSON / CSV Export| UI_Results
    UI_Results --> UI_Evidence
```

---

## 2. End-to-End Data-Flow Trace (One Complete Assessment)

This section traces a live packaging inspection from frontend image selection through all 10 backend pipeline stages until result delivery, database storage, and PDF generation.

```mermaid
sequenceDiagram
    autonumber
    actor User as Presenter / Officer
    participant Frontend as Frontend (Analyze.tsx / api.ts)
    participant API as FastAPI Router (api/analyze.py)
    participant Sec as Security & Rate Limiter (auth/security.py)
    participant Svc as Analysis Service (services/analysis_service.py)
    participant OCR as PaddleOCR Engine (ocr/paddle_engine.py)
    participant Vis as Vision Pipeline (vision/pipeline.py)
    participant Ext as Structured Extractor (compliance/extractor.py)
    participant Comp as Compliance Engine (compliance/engine.py)
    participant DB as Database (database/db.py - SQLite WAL)
    participant Rep as Report Service (services/report_service.py)

    User->>Frontend: Selects Front + Back images (or One-Click Demo Sample)
    Frontend->>Frontend: Creates local blob URLs, validates file sizes (<10MB)
    User->>Frontend: Clicks "Run Live AI Analysis"
    Frontend->>API: POST /api/analyze (multipart/form-data: files[], labels[], product_id)
    API->>Sec: check_analysis_rate_limit(client_ip)
    Sec-->>API: Allowed (HTTP 200)
    API->>API: validate_image_file() for magic bytes & extensions
    API->>Sec: check_tenant_access(user, product)
    API->>Svc: analyze_products(files, labels, owner_user_id, organization_id, product_id)
    
    rect rgb(240, 245, 255)
        note over Svc,Vis: Pipeline Phase 1-4: Ingestion, Quality, OCR & Computer Vision
        Svc->>Svc: Generates UUID analysis_id
        Svc->>Svc: process_and_save_image() -> writes to uploads/{id}_{label}_{filename}
        Svc->>Svc: assess_image_quality() -> brightness, blur (Laplacian), contrast
        Svc->>OCR: asyncio.gather(ocr_engine.extract(path)...) (PP-OCRv4 dual-pass)
        OCR-->>Svc: OCRResult(full_text, words[], bboxes[], confidence)
        Svc->>Vis: vision_pipeline.analyze_image() -> QR/Barcode decode, Veg/Non-Veg symbol, panel classification
        Vis-->>Svc: VisionAnalysisResult
    end

    rect rgb(245, 255, 240)
        note over Svc,Comp: Pipeline Phase 5-8: Extraction, Statutory Rules & Calibration
        Svc->>Ext: llm_extractor.extract(combined_text, images)
        Ext-->>Svc: ProductInfo(mrp, net_quantity, dates, fssai, manufacturer, etc.)
        Svc->>Comp: compliance_engine.check(product_info, combined_text, images, analysis_id)
        Comp->>Comp: PackageContext.infer_context() -> food, import, wholesale
        Comp->>Comp: Iterates LM-001..LM-009 & FS-001..FS-005 evaluators
        Comp->>Comp: locate_evidence_for_rule() -> Bounding box spatial matching
        Comp->>Comp: calculate_score() -> Category weights & Risk index
        Comp-->>Svc: ComplianceResult(score, status, checks[], recommendations[], risk_assessment)
        Svc->>Svc: compute_font_size_and_readability() (Rule 12 area-to-height ratio)
        Svc->>Svc: External GS1 & FSSAI cross-checking
    end

    rect rgb(255, 245, 240)
        note over Svc,DB: Pipeline Phase 9-10: Cryptographic Hashing & Persistence
        Svc->>Svc: compute_analysis_integrity_hash() -> SHA-256 of canonical inputs & results
        Svc->>DB: save_analysis(db_data) -> INSERT INTO analyses
        Svc->>DB: _auto_ingest_officer_review() -> If FAIL/REVIEW, creates officer_reviews row
        DB-->>Svc: Persisted
    end

    Svc-->>API: AnalysisResponse object
    API-->>Frontend: HTTP 200 JSON (AnalysisResponse)
    Frontend->>Frontend: Navigates to /results/{id}
    Frontend->>User: Renders ResultsHeader (LIVE AI ANALYSIS badge), Findings, Evidence Canvas

    opt PDF Report Export
        User->>Frontend: Clicks "Download PDF"
        Frontend->>API: GET /api/report/{id}/pdf?lang=en (with Bearer or download ticket)
        API->>DB: get_analysis(id) & check_tenant_access()
        API->>Rep: generate_pdf_report(analysis, lang="en")
        Rep-->>Frontend: application/pdf binary stream
        Frontend->>User: Downloads metrcheck-report-{id}-en.pdf
    end
```

### Detailed Pipeline Stage Breakdown

| Stage | Subsystem & File | Function / Class | Input Data | Output Data | Memory / DB Persistence | Error Handling & Tests |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Ingestion & Validation** | `backend/api/analyze.py`<br>`backend/utils/file_validation.py` | `analyze_endpoint()`<br>`validate_image_file()` | `List[UploadFile]` (1–4 images), `labels: str`, `product_id: Optional[str]` | Validated list of file streams, sanitized labels | Memory stream & rate limiter check | Raises HTTP 400 (empty/invalid file), 413 (>10MB), 415 (unsupported MIME). Covered in `test_preflight_packaging_check.py`. |
| **2. Storage & Image Quality** | `backend/services/image_service.py`<br>`backend/ocr/quality.py` | `process_and_save_image()`<br>`assess_image_quality()` | `UploadFile`, destination path | Standardized RGB JPEG/PNG on disk, quality dictionary (Laplacian blur score, brightness, contrast) | Persisted to filesystem at `settings.UPLOAD_DIR` (`uploads/{uuid}_{label}_{name}`) | Catches corrupt EXIF headers, invalid color profiles. Logs warnings; falls back safely. Covered in `test_vision_quality.py`. |
| **3. Dual-Pass OCR** | `backend/ocr/factory.py`<br>`backend/ocr/paddle_engine.py` | `PaddleOCREngine.extract()` | Saved image filesystem path | `OCRResult` containing `full_text`, list of `OCRWord` with normalized `bbox: [x1,y1,x2,y2]`, confidence | In-memory `OCRResult` | Catches uninitialized Paddle weights; falls back to Tesseract/EasyOCR or heuristic scanner. Covered in `test_ocr.py`. |
| **4. Computer Vision** | `backend/vision/pipeline.py`<br>`backend/vision/symbols.py` | `VisionPipeline.analyze_image()` | File path, OCR text, bounding box word dictionaries | `VisionAnalysisResult` (QR decode payload, barcode GS1, veg/non-veg green/brown dot detection, panel classification) | Attached in-memory to `ProductImageEvidence.vision_analysis` | Non-fatal try/catch: vision errors log warnings without halting OCR pipeline. Covered in `test_vision_pipeline.py`. |
| **5. Entity Extraction** | `backend/extraction/llm_extractor.py`<br>`backend/compliance/extractor.py` | `RuleBasedExtractor.extract()` | Combined multi-panel OCR text, `List[ProductImageEvidence]` | `ProductInfo` model (mrp, net_qty, batch, dates, fssai, brand, manufacturer, packer, country, ingredients) | In-memory `ProductInfo` with `field_provenance` linking token bounding boxes | Multi-regex anchor fallback, multilingual script transliteration. Covered in `test_extraction_quality.py`. |
| **6. Statutory Compliance** | `backend/compliance/engine.py`<br>`backend/compliance/rules/*` | `ComplianceEngine.check()` | `ProductInfo`, combined text, image evidence, `analysis_id` | `ComplianceResult` (score: 0–100, status: PASS/FAIL/WARNING/NEEDS_REVIEW, checks: List[ComplianceCheck], issues: List[ComplianceIssue]) | In-memory `ComplianceResult` | Individual rule evaluation failure defaults to `NEEDS_REVIEW` (fails safe). Covered in `test_compliance_scoring_risk.py`. |
| **7. Calibration & Rule 12** | `backend/compliance/rules/legal_metrology.py`<br>`backend/services/calibration_service.py` | `compute_font_size_and_readability()`<br>`detect_aruco_marker()` | `ProductInfo`, `OCRResult`, `List[ProductImageEvidence]`, `checks` | `FontSizeAnalysisResult` (principal display panel area $A$, minimum mandatory numeral height $h_{min}$, actual font height $h_{act}$, Rule 12 pass/fail) | Attached in-memory to `AnalysisResponse.font_size_analysis` | Missing ArUco calibration marker defaults to optical pixel-density estimation. Covered in `test_section17_ux_accessibility.py`. |
| **8. External Cross-Check** | `backend/integrations/cross_checker.py`<br>`backend/integrations/fssai/verifier.py` | `cross_check_engine.evaluate_all()` | `extracted_data`, FSSAI license, GS1 barcode, QR payload | `ExternalVerificationSummary` (mismatches, manufacturer registration match, barcode consistency score) | Cached in `verification_cache` table (7-day TTL) | Offline fallback: network failures do not fail assessment; sets `offline_mode=True`. Covered in `test_external_cross_checking.py`. |
| **9. Cryptographic Hashing** | `backend/services/integrity_service.py` | `compute_analysis_integrity_hash()` | `analysis_id`, `created_at`, `product_name`, `score`, `status`, extracted dictionary, compliance dictionary | Canonical deterministic SHA-256 hash string (`hex` digest) | Stored in `analyses.integrity_hash` column | Deterministic JSON key sorting. Covered in `test_sec08_integrity_endpoint.py`. |
| **10. Persistence & Ingestion** | `backend/database/db.py`<br>`backend/services/review_service.py` | `save_analysis()`<br>`_auto_ingest_officer_review()` | Dictionary of analysis fields, serialized JSON strings | Stored row in `analyses` table; conditionally creates row in `officer_reviews` | Persisted to SQLite WAL database (`metrcheck.db`) | SQLite busy timeout 5000ms with WAL journaling. Covered in `test_tenant_data_integrity.py`. |

---

## 3. Frontend-to-Backend API Map

The MetrCheck AI platform exposes 20 distinct router modules with strict tenant-scoping and authorization guards.

| HTTP Method | API Endpoint | Router Module | Auth Guard & Role Required | Frontend Service Caller (`api.ts`) | Request Payload | Response Schema |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/analyze` | `api/analyze.py` | `public_user` (Optional Auth) | `api.analyzeProducts()` | `multipart/form-data`: `files[]`, `labels`, `product_id` | `AnalysisResponse` |
| `POST` | `/api/analyze/text` | `api/analyze.py` | `public_user` (Optional Auth) | `api.analyzeText()` | `{"text": str, "product_id": Optional[str]}` | `AnalysisResponse` |
| `POST` | `/api/analyze/manual` | `api/analyze.py` | `public_user` (Optional Auth) | `api.analyzeManual()` | `ManualProductCheckPayload` | `AnalysisResponse` |
| `GET` | `/api/history` | `api/history.py` | `get_current_user` (All Roles) | `api.getHistory()` | Query: `limit`, `offset`, `search`, `status` | `List[HistoryItem]` |
| `GET` | `/api/history/{id}` | `api/history.py` | `get_current_user` (All Roles) | `api.getAnalysis()` | Path: `id` | `AnalysisResponse` |
| `DELETE` | `/api/history/{id}` | `api/history.py` | `get_current_user` (Owner / Admin) | `api.deleteAnalysis()` | Path: `id` | `{"message": str, "id": str}` |
| `GET` | `/api/report/{id}/pdf` | `api/report.py` | Bearer or `ticket` query | `api.downloadReportFile()` | Path: `id`, Query: `lang`, `ticket` | `application/pdf` |
| `GET` | `/api/report/{id}/csv` | `api/report.py` | Bearer or `ticket` query | `api.downloadReportFile()` | Path: `id`, Query: `ticket` | `text/csv` |
| `GET` | `/api/report/{id}/xlsx`| `api/report.py` | Bearer or `ticket` query | `api.downloadReportFile()` | Path: `id`, Query: `ticket` | `application/vnd.openxmlformats` |
| `GET` | `/api/report/{id}/json`| `api/report.py` | Bearer or `ticket` query | `api.downloadReportFile()` | Path: `id`, Query: `ticket` | `application/json` |
| `POST` | `/api/reports/download-ticket` | `api/report.py` | `get_current_user` | `api.createDownloadTicket()` | `{"resource_type": str, "resource_id": str}` | `{"ticket": str, "expires_at": float}` |
| `GET` | `/api/demo/{case_id}` | `api/demo.py` | Public | `api.getDemoCase()` | Path: `case_id` (`1`, `2`, `3`) | `AnalysisResponse` (`demo-` ID) |
| `GET` | `/api/demo/samples` | `api/demo.py` | Public | `api.getDemoSamples()` | None | `List[DemoLiveSample]` |
| `GET` | `/api/health` | `api/health.py` | Public | `api.getHealth()` | None | `{"status": str, "ocr_ready": bool, "ocr_engine": str}` |
| `POST` | `/api/auth/login` | `auth/routes.py` | Public | `api.login()` | `{"username": str, "password": str}` | `AuthResponse` (`access_token`, `user`) |
| `GET` | `/api/auth/me` | `auth/routes.py` | `get_current_user` | `api.getCurrentUser()` | None | `AuthUser` |
| `GET` | `/api/products` | `api/products.py` | `get_current_user` | `api.getProducts()` | Query: `search`, `category`, `status` | `List[ProductCatalogItem]` |
| `POST` | `/api/products` | `api/products.py` | `get_current_user` (Merchant / Admin) | `api.createProduct()` | `ProductCreatePayload` | `ProductCatalogItem` |
| `GET` | `/api/enforcement/cases` | `api/enforcement.py` | `require_roles(ROLE_ENFORCEMENT, ROLE_ADMIN)` | `api.getEnforcementCases()` | Query: `status`, `severity`, `limit` | `List[EnforcementCaseListItem]` |
| `POST` | `/api/enforcement/cases` | `api/enforcement.py` | `require_roles(ROLE_ENFORCEMENT, ROLE_ADMIN)` | `api.createEnforcementCase()` | `EnforcementCaseCreatePayload` | `EnforcementCaseDetail` |
| `POST` | `/api/enforcement/notices` | `api/enforcement.py` | `require_roles(ROLE_ENFORCEMENT, ROLE_ADMIN)` | `api.issueEnforcementNotice()` | `NoticeIssuePayload` | `EnforcementNoticeItem` |
| `GET` | `/api/admin/users` | `auth/routes.py` | `require_roles(ROLE_ADMIN)` | `api.adminListUsers()` | Query: `search`, `role`, `status` | `List[AdminUserItem]` |
| `POST` | `/api/admin/users/invite` | `auth/routes.py` | `require_roles(ROLE_ADMIN)` | `api.adminInviteUser()` | `AdminInviteUserRequest` | `AdminInviteUserResponse` |
| `GET` | `/api/admin/security-logs` | `backend/main.py` | `require_roles(ROLE_ADMIN)` | `api.adminGetSecurityLogs()` | Query: `limit`, `event_type` | `List[SecurityAuditLogItem]` |
| `GET` | `/api/admin/security-logs/verify-chain` | `backend/main.py` | `require_roles(ROLE_ADMIN)` | `api.adminVerifySecurityAuditChain()` | None | `{"valid": bool, "verified_blocks": int, "latest_hash": str}` |

---

## 4. Database Schema and Persistence Architecture

The database engine is **SQLite 3** operating in **WAL mode (`PRAGMA journal_mode=WAL;`)** with **`PRAGMA busy_timeout=5000;`** managed asynchronously via `aiosqlite`.

```mermaid
erDiagram
    ORGANIZATIONS ||--o{ USERS : "has members"
    ORGANIZATIONS ||--o{ PRODUCTS : "owns catalog"
    ORGANIZATIONS ||--o{ ANALYSES : "scopes scans"
    ORGANIZATIONS ||--o{ ENFORCEMENT_CASES : "investigates"
    
    PRODUCTS ||--o{ ANALYSES : "linked screenings"
    ANALYSES ||--o{ OFFICER_REVIEWS : "incepts review"
    ANALYSES ||--o{ ENFORCEMENT_CASES : "evidence for case"
    ENFORCEMENT_CASES ||--o{ ENFORCEMENT_NOTICES : "issues notices"
    ENFORCEMENT_CASES ||--o{ PENALTY_CALCULATIONS : "records fines"

    ORGANIZATIONS {
        string id PK "org_ministry, org_merchant_demo, etc."
        string name
        string org_type "REGULATOR | MERCHANT | USER"
        string jurisdiction
        string status "ACTIVE | SUSPENDED"
        string created_at
        string updated_at
    }

    USERS {
        integer id PK
        string username UK
        string password_hash "PBKDF2-HMAC-SHA256"
        string salt "16-byte hex"
        string role "ADMIN | ENFORCEMENT_OFFICER | AUDIT_OFFICER | MERCHANT_PUBLIC | PUBLIC_USER"
        string organization_id FK
        string status "ACTIVE | SUSPENDED | INVITED"
        integer token_version "Session revocation counter"
        string email
        string created_at
    }

    PRODUCTS {
        string id PK "UUID"
        string organization_id FK
        string owner_user_id FK
        string product_name
        string brand_name
        string category
        string gtin_barcode
        string fssai_license
        string status "ACTIVE | ARCHIVED"
        string created_at
    }

    ANALYSES {
        string id PK "UUID"
        string product_name
        string image_filename
        string ocr_text
        string extracted_data "JSON serialized ProductInfo"
        string compliance_result "JSON serialized ComplianceResult"
        float score "0.0 - 100.0"
        string status "COMPLIANT | POTENTIAL NON-COMPLIANCE"
        string images "JSON list of ProductImageEvidence"
        string owner_user_id FK
        string organization_id FK
        string product_id FK
        string integrity_hash "Deterministic SHA-256"
        string created_at
    }

    OFFICER_REVIEWS {
        string id PK "UUID"
        string analysis_id FK
        string status "PENDING_REVIEW | APPROVED | REJECTED | ESCALATED"
        string assigned_officer
        string verified_by
        float ai_score
        string ai_snapshot "Immutable JSON snapshot"
        string human_verified_result "JSON modifications"
        string organization_id FK
        string created_at
    }

    ENFORCEMENT_CASES {
        string id PK "UUID"
        string case_reference UK "ENF-2026-XXXX"
        string analysis_id FK
        string organization_id FK
        string merchant_organization_id FK
        string status "OPEN | UNDER_INVESTIGATION | NOTICE_ISSUED | RESOLVED | CLOSED"
        string severity "CRITICAL | HIGH | MEDIUM | LOW"
        string violation_summary
        string timeline "JSON audit array"
        string created_at
    }

    ENFORCEMENT_NOTICES {
        string id PK "UUID"
        string notice_reference UK "NOT-2026-XXXX"
        string case_id FK
        string notice_type "SHOW_CAUSE | DEFECT_RECTIFICATION | SEIZURE"
        string status "ISSUED | SERVED | RESPONDED | EXPIRED"
        string subject
        string content
        integer deadline_days
        string created_at
    }

    SECURITY_AUDIT_LOGS {
        integer id PK
        string event_type "LOGIN_SUCCESS | USER_SUSPENDED | CASE_OPENED"
        string actor_username
        string ip_address
        string resource_id
        string details
        string prev_hash "Cryptographic chain link"
        string event_hash "SHA256(prev_hash + event_data)"
        string created_at
    }
```

### Table Inventory & Index Coverage

1. **`organizations`**: Multi-tenant partitioning root (`id` PRIMARY KEY).
2. **`users`**: Tenant-bound credentials, PBKDF2 salts, `token_version` for instant session revocation, partial unique index `idx_users_email` on non-empty emails.
3. **`products`**: Merchant product catalog master records with soft-archiving (`idx_products_org`, `idx_products_owner`, `idx_products_gtin`).
4. **`analyses`**: Full packaging inspection records, JSON serialized statutory checks and extracted metadata (`idx_analyses_org`, `idx_analyses_product_id`).
5. **`officer_reviews`**: Four-eyes review workspace records preserving immutable AI snapshot (`idx_officer_reviews_org`, `idx_reviews_org`).
6. **`enforcement_cases`**: Statutory investigation records with partial unique index `idx_enf_cases_unique_active_analysis` preventing duplicate active cases on the same inspection.
7. **`enforcement_notices`**: Legal notices issued under Rule 6/Section 18.
8. **`penalty_calculations`**: Section 36 statutory penalty calculation ledger.
9. **`download_tickets`**: Cryptographically signed, single-use, 60-second expiring download tokens (`idx_download_tickets_exp`).
10. **`rate_limit_events`**: Multi-worker distributed rate limiting ledger (`idx_rate_limit_events_key_ts`).
11. **`security_audit_logs`**: Immutable, append-only cryptographic SHA-256 blockchain audit ledger.
12. **`verification_cache`**: 7-day TTL cache for GS1 and FSSAI external registry checks.
13. **`artworks`** & **`version_comparisons`**: Pre-print packaging artwork iterations and visual delta comparisons.

---

## 5. Authentication, Authorization & Tenant Isolation Model

### 1. Cryptographic Authentication Mechanism
- **Password Hashing:** PBKDF2-HMAC-SHA256 using 200,000 iterations with a dedicated 16-byte cryptographic random salt per user (`hash_password()`, `verify_password()`).
- **Token Signing:** Standard-library HMAC-SHA256 signing of Base64URL-encoded JSON claims (`sub`, `role`, `token_version`, `iat`, `exp`). No vulnerable external JWT dependencies.
- **Session Revocation:** Every token carries `token_version`. If an administrator changes a user's role or suspends an account, `token_version` is incremented in the database, instantly invalidating all outstanding tokens.

### 2. Role Hierarchy & Workspace Access
```
ADMIN (Superuser / Directorate Administrator)
   └── ENFORCEMENT_OFFICER (Statutory Enforcement & Investigation)
         └── AUDIT_OFFICER (Quality & Packaging Verification Inspector)
               └── MERCHANT_PUBLIC (Brand / Packaging Manufacturer)
                     └── PUBLIC_USER (Consumer / Citizen Scanner)
```

- **Consumer (`PUBLIC_USER`):** Access to Public Scanner (`/analyze`), personal scan history (`/history`), and public rule explorer (`/rules`).
- **Merchant (`MERCHANT_PUBLIC`):** Access to SKU Catalog (`/products`), SKU Linking, Pre-Print Compliance (`/preprint`), and Version Comparison (`/version-comparison`). Strictly scoped to records where `organization_id == user.organization_id` AND `owner_user_id == user.username`.
- **Audit Officer (`AUDIT_OFFICER`):** Access to Audit Workspace (`/officer-dashboard`), Technical Review Queue (`/reviews`), ArUco physical calibration, and font size inspection. Scoped to `organization_id == user.organization_id`.
- **Enforcement Officer (`ENFORCEMENT_OFFICER`):** Access to Enforcement Dashboard (`/enforcement`), Case Investigation Workspace (`/enforcement/cases/{id}`), Show-Cause Notice Generation, and Penalty Calculator. Scoped to `organization_id == user.organization_id`.
- **Administrator (`ADMIN`):** Global statutory oversight across all organizations, user provisioning (`/admin/users`), officer request approval (`/admin/officer-requests`), and cryptographic audit log verification (`/admin/audit-logs`).

### 3. Record-Level Tenant Isolation (`check_tenant_access()`)
Located in `backend/auth/security.py`, `check_tenant_access()` enforces a strictly **fail-closed** multi-tenant security barrier:
1. **Unauthenticated Users:** Denied unless endpoint explicitly declares `allow_public=True`.
2. **Administrators:** Granted system-wide statutory oversight.
3. **Officers (Audit & Enforcement):** Both `user.organization_id` and `resource.organization_id` must be non-empty strings and match exactly. Legacy unassigned records (`organization_id == ""`) are restricted to `ADMIN` only.
4. **Merchants:** Must satisfy both organization match (`user.organization_id == resource.organization_id`) AND ownership match (`resource.owner_user_id == user.username`).
5. **Direct IDOR Protection:** Query filters in SQL always append `WHERE organization_id = ?` regardless of URL parameters supplied by the client.

### 4. Single-Use Cryptographic Download Tickets
To prevent token leakage in browser history or PDF query strings, MetrCheck AI implements short-lived download tickets:
1. Frontend calls `POST /api/reports/download-ticket` with Bearer token, requesting access for a specific `resource_id` (e.g., analysis UUID).
2. Server validates user permissions, generates a ticket in `download_tickets` table with a 60-second expiration, signs it with server secret (`dt_{uuid}_{hmac}`), and returns it.
3. Client opens `/api/report/{id}/pdf?ticket=dt_...`.
4. Server verifies HMAC signature, ensures `expires_at > now`, confirms `redeemed_at IS NULL`, checks `resource_id` matches the URL, marks `redeemed_at = now` (atomic single-use), and streams the file.

---

## 6. Verified Capabilities vs. Unverified Assumptions

| Feature Area | Verified Codebase Capability | Status | Evidence / File Path |
| :--- | :--- | :--- | :--- |
| **PaddleOCR Engine** | Dual-pass PP-OCRv4 with deep-learning detection, angle classification, and recognition | **VERIFIED** | `backend/ocr/paddle_engine.py` (lines 35–180) |
| **Safe Background Warmup** | Lifespan background task pre-warming model weights without blocking server startup | **VERIFIED** | `backend/main.py` (lines 24–32), `backend/ocr/factory.py` (lines 40–75) |
| **Multi-Panel Processing** | Concurrent processing of up to 4 packaging panels (Front, Back, Side 1, Side 2) | **VERIFIED** | `backend/services/analysis_service.py` (lines 68–120) |
| **Statutory Rule Evaluation** | Automated evaluation of 9 Legal Metrology rules + 5 FSSAI regulations | **VERIFIED** | `backend/compliance/rules/legal_metrology.py`, `backend/compliance/rules/fssai.py` |
| **Rule 12 Font Sizing** | Mathematical area-to-numeral height compliance ratio ($A \le 50 \text{ cm}^2 \implies h \ge 1.0 \text{ mm}$, etc.) | **VERIFIED** | `backend/compliance/rules/legal_metrology.py` (`compute_font_size_and_readability`) |
| **ArUco Calibration** | Metric scale calibration using 20mm/30mm 4x4 ArUco markers | **VERIFIED** | `backend/services/calibration_service.py` |
| **Visual Bounding Boxes** | Token-level bounding box coordinate binding on canvas overlay | **VERIFIED** | `frontend/src/components/EvidenceViewer.tsx`, `backend/compliance/evidence_locator.py` |
| **Multilingual Parity** | 10 Indian regional languages code-split with lazy loading and 100% key symmetry | **VERIFIED** | `frontend/src/i18n/index.ts`, `backend/tests/multilingual/test_frontend_i18n.py` |
| **Cryptographic Audit Chain** | SHA-256 block hash chain linking all administrative security events | **VERIFIED** | `backend/database/db.py` (`get_security_audit_logs`, `verify_security_audit_chain`) |
| **Government Portal Live Sync** | Live scraper querying live FSSAI FoSCoS portal without mock fixtures | **UNVERIFIED / OFFLINE FALLBACK** | `backend/integrations/fssai/verifier.py` uses heuristic regex & verification cache; live portal requires captcha solver. |
| **Direct Hardware Scale Integration** | Physical RS-232 serial connection to electronic weighing scales | **UNVERIFIED / PLANNED** | Schema fields exist (`legal_metrology_license`), but physical RS-232 drivers are simulated via manual weight inputs. |

---

## 7. Prioritized Architecture Risks, Missing Connections & Deficiencies

### Risk Assessment Matrix

```
┌─────────────┬─────────────────────────────────────────────────────────────────────────┐
│ Critical    │ None identified. 0 build errors, 0 test failures across 1,052 tests.    │
├─────────────┼─────────────────────────────────────────────────────────────────────────┤
│ High        │ External Registry Captchas (GS1/FSSAI live syncing requires fallback)    │
├─────────────┼─────────────────────────────────────────────────────────────────────────┤
│ Medium      │ Local File Storage in multi-node containers requires persistent volume  │
├─────────────┼─────────────────────────────────────────────────────────────────────────┤
│ Low         │ Browser camera stream requires HTTPS context in production deployments  │
└─────────────┴─────────────────────────────────────────────────────────────────────────┘
```

#### 1. High Priority: External Registry Verification Resilience
- **Finding:** While `fssai_verifier` and `gs1_verifier` perform structural regex checksums and query `verification_cache`, live upstream government portals (e.g., FoSCoS) frequently implement anti-bot captchas or experience downtime.
- **Current Safeguard:** `cross_check_engine` catches network exceptions and sets `offline_mode=True` without failing the user's packaging scan.
- **Recommendation:** Deploy a scheduled background worker to pre-sync trusted brand FSSAI license databases into `verification_cache`.

#### 2. Medium Priority: Upload Directory Persistence in Clustered Deployments
- **Finding:** Uploaded packaging images are saved to local filesystem storage (`settings.UPLOAD_DIR = "uploads"`). If deployed across multiple stateless Docker containers behind a load balancer without a shared volume, image URLs (`/api/images/{filename}`) could return 404 on secondary nodes.
- **Current Safeguard:** Single-node deployments (hackathon prototype) and tests operate on a shared local volume.
- **Recommendation:** In production Kubernetes deployment, mount an S3-compatible object store (e.g., MinIO or AWS S3) via an abstract storage driver in `backend/services/image_service.py`.

#### 3. Low Priority: Camera API Secure Context
- **Finding:** The live photo capture button in `frontend/src/pages/Analyze.tsx` uses `navigator.mediaDevices.getUserMedia()`. Modern browsers block camera access on unencrypted HTTP (except `localhost`).
- **Current Safeguard:** File gallery input fallback (`<input type="file" accept="image/*" capture="environment" />`) is present for mobile devices.
- **Recommendation:** Ensure TLS/SSL certificates (HTTPS) are provisioned on reverse proxies (Nginx/Caddy) for staging and production domains.

---

## 8. Test Suite Inventory & QA Coverage

The repository maintains an automated test suite comprising **1,052 automated tests** across 48 test modules.

```
============================== Backend Test Summary ===============================
Collected: 1,055 items
Passed:    1,052 tests (99.71%)
Skipped:   3 tests (Optional live hardware integration tests)
Failed:    0 tests (0.00%)
Duration:  324.15 seconds (~5m 24s)
===================================================================================
```

### Key Test Suites by Domain

1. **End-to-End Demo Readiness:**
   - [`backend/tests/test_e2e_demo_readiness.py`](file:///d:/SIH/Legal%20Metrology%20Compliance%20AI%20Prototype/backend/tests/test_e2e_demo_readiness.py): 7 E2E tests validating health, sample loading, Alpino reference scan, Tak-a-Tak deficient scan, precomputed demo fixtures, PDF exports, and error handling.
   - [`backend/tests/test_demo_samples.py`](file:///d:/SIH/Legal%20Metrology%20Compliance%20AI%20Prototype/backend/tests/test_demo_samples.py): 4 tests verifying demo sample catalog endpoints.

2. **OCR & Model Warmup:**
   - [`backend/tests/test_ocr.py`](file:///d:/SIH/Legal%20Metrology%20Compliance%20AI%20Prototype/backend/tests/test_ocr.py): 11 tests verifying PaddleOCR inference, warmup idempotency, and thread safety.

3. **Multilingual & Localization:**
   - [`backend/tests/multilingual/test_frontend_i18n.py`](file:///d:/SIH/Legal%20Metrology%20Compliance%20AI%20Prototype/backend/tests/multilingual/test_frontend_i18n.py): 12 tests verifying JSON syntax, Unicode character count (>1,000 authentic script characters per language), zero question-mark corruption, and 100% key symmetry between English and 9 regional Indian languages.

4. **Tenant Isolation & Security (SEC-01 to SEC-12):**
   - [`backend/tests/test_sec06_tenant_isolation.py`](file:///d:/SIH/Legal%20Metrology%20Compliance%20AI%20Prototype/backend/tests/test_sec06_tenant_isolation.py): 27 tests verifying strict fail-closed cross-tenant blocking.
   - [`backend/tests/test_sec08_statistics_isolation.py`](file:///d:/SIH/Legal%20Metrology%20Compliance%20AI%20Prototype/backend/tests/test_sec08_statistics_isolation.py): 37 tests verifying dynamic date filtering and tenant scoping on trend aggregations.
   - [`backend/tests/test_sec11_download_ticket_security.py`](file:///d:/SIH/Legal%20Metrology%20Compliance%20AI%20Prototype/backend/tests/test_sec11_download_ticket_security.py): 16 tests verifying single-use, 60s expiration, and HMAC signing on download tickets.
   - [`backend/tests/test_sec12_distributed_rate_limiting.py`](file:///d:/SIH/Legal%20Metrology%20Compliance%20AI%20Prototype/backend/tests/test_sec12_distributed_rate_limiting.py): 15 tests verifying multi-worker database rate limiting.

---

## 9. Supporting Source File Index

| Subsystem | Exact Source File Path | Key Functions / Symbols |
| :--- | :--- | :--- |
| **Application Entry & Middleware** | [`backend/main.py`](file:///d:/SIH/Legal%20Metrology%20Compliance%20AI%20Prototype/backend/main.py) | `lifespan()`, `add_security_headers()`, `list_security_audit_logs()` |
| **Analysis Gateway** | [`backend/api/analyze.py`](file:///d:/SIH/Legal%20Metrology%20Compliance%20AI%20Prototype/backend/api/analyze.py) | `analyze_endpoint()`, `analyze_text_endpoint()`, `analyze_manual_endpoint()` |
| **Core Analysis Service** | [`backend/services/analysis_service.py`](file:///d:/SIH/Legal%20Metrology%20Compliance%20AI%20Prototype/backend/services/analysis_service.py) | `analyze_products()`, `_auto_ingest_officer_review()` |
| **PaddleOCR Engine** | [`backend/ocr/paddle_engine.py`](file:///d:/SIH/Legal%20Metrology%20Compliance%20AI%20Prototype/backend/ocr/paddle_engine.py) | `PaddleOCREngine.extract()`, `PaddleOCREngine.warmup()` |
| **Compliance Rule Engine** | [`backend/compliance/engine.py`](file:///d:/SIH/Legal%20Metrology%20Compliance%20AI%20Prototype/backend/compliance/engine.py) | `ComplianceEngine.check()`, `EVALUATORS`, `FIELD_REGIONS` |
| **Legal Metrology Rules** | [`backend/compliance/rules/legal_metrology.py`](file:///d:/SIH/Legal%20Metrology%20Compliance%20AI%20Prototype/backend/compliance/rules/legal_metrology.py) | `evaluate_lm_001` through `evaluate_lm_009`, `compute_font_size_and_readability` |
| **FSSAI Regulations** | [`backend/compliance/rules/fssai.py`](file:///d:/SIH/Legal%20Metrology%20Compliance%20AI%20Prototype/backend/compliance/rules/fssai.py) | `evaluate_fs_001` through `evaluate_fs_005` |
| **Computer Vision Pipeline** | [`backend/vision/pipeline.py`](file:///d:/SIH/Legal%20Metrology%20Compliance%20AI%20Prototype/backend/vision/pipeline.py) | `VisionPipeline.analyze_image()`, `detect_veg_nonveg_symbol()` |
| **Database & Schema** | [`backend/database/db.py`](file:///d:/SIH/Legal%20Metrology%20Compliance%20AI%20Prototype/backend/database/db.py) | `init_db()`, `save_analysis()`, `get_analysis()`, `verify_security_audit_chain()` |
| **Authentication & Tenant Guard** | [`backend/auth/security.py`](file:///d:/SIH/Legal%20Metrology%20Compliance%20AI%20Prototype/backend/auth/security.py) | `hash_password()`, `create_token()`, `get_current_user()`, `check_tenant_access()` |
| **Report Generation** | [`backend/services/report_service.py`](file:///d:/SIH/Legal%20Metrology%20Compliance%20AI%20Prototype/backend/services/report_service.py) | `generate_pdf_report()`, `NumberCanvas` |
| **Frontend Root & Router** | [`frontend/src/App.tsx`](file:///d:/SIH/Legal%20Metrology%20Compliance%20AI%20Prototype/frontend/src/App.tsx) | `AppRoutes`, `ProtectedRoute`, `RoleGuard` |
| **Frontend Analysis View** | [`frontend/src/pages/Analyze.tsx`](file:///d:/SIH/Legal%20Metrology%20Compliance%20AI%20Prototype/frontend/src/pages/Analyze.tsx) | `Analyze()`, `handleSelectSample()`, `startAnalysis()`, `runDemo()` |
| **Frontend Results & Provenance** | [`frontend/src/pages/Results.tsx`](file:///d:/SIH/Legal%20Metrology%20Compliance%20AI%20Prototype/frontend/src/pages/Results.tsx) | `Results()`, `isDemo` computation, `ResultsHeader` integration |
| **Frontend Evidence Viewer** | [`frontend/src/components/EvidenceViewer.tsx`](file:///d:/SIH/Legal%20Metrology%20Compliance%20AI%20Prototype/frontend/src/components/EvidenceViewer.tsx) | `EvidenceViewer()`, `renderCanvas()`, `drawBBoxOverlay()` |
| **Frontend API Client** | [`frontend/src/services/api.ts`](file:///d:/SIH/Legal%20Metrology%20Compliance%20AI%20Prototype/frontend/src/services/api.ts) | `api.analyzeProducts()`, `api.getDemoCase()`, `api.downloadReportFile()` |
