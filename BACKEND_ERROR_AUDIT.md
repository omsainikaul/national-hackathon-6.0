# MetrCheck AI — Comprehensive Backend Diagnostic Audit Report (Phase 1)
**Metrology & Statutory Packaging Compliance AI Prototype**  
**Audit Phase:** Phase 1 (Diagnostic & Repository-Wide Static/Dynamic Inspection — READ-ONLY)  
**Timestamp:** October 2026  
**Auditor:** Principal Backend Engineer, FastAPI Architect & Application Security Reviewer  

---

## 1. Initial Git State & Environment Context

### 1.1 Git Working Tree & Branch Integrity
- **Branch:** `main` (Up to date with `origin/main`)
- **Working Tree State:** All previous sprint deliverables (Sprint 1 statistics timestamps, Sprint 2 lazy localization chunking, Sprint 3 Tasks 1–4 demo readiness & truthful indicators) are intact.
- **Modified & Untracked Files:**
  - `backend/api/demo.py` (Cleaned top-level imports, sample loading, fixture serving)
  - `backend/api/health.py` (Truthful OCR readiness reporting)
  - `backend/main.py` (Safe startup lifespan and model warmup)
  - `backend/ocr/*` (OCR engine factory and fallback resolution)
  - `backend/tests/*` (E2E readiness and isolation suites)
  - `frontend/src/*` (Mode indicators, lazy locale dictionaries, sample loader)
  - `METRCHECK_ARCHITECTURE_AUDIT.md` (Architecture and technical data-flow audit)
  - `SPRINT_3_DEMO_READINESS_AUDIT.md` (Demo readiness audit report)

### 1.2 Runtime Environment & Launch Parameters
- **Python Interpreter:** Python 3.14.3 (`win32`, `C:\Users\Om Saini\AppData\Local\Programs\Python\Python314\python.exe`)
- **Backend Directory:** `d:\SIH\Legal Metrology Compliance AI Prototype\backend`
- **Application Startup Command:** `uvicorn main:app --host 0.0.0.0 --port 8000 --reload`
- **Database Engine:** SQLite in Write-Ahead Logging (`WAL`) mode (`backend/metrc_check.db`)
- **Core Frameworks:** FastAPI `0.141.1`, Starlette `1.6.0`, Pydantic `2.13.5`, PyPDF `6.14.1`, ReportLab `5.0.1`, OpenCV `5.0.0.93`, NumPy `2.4.2`

---

## 2. Backend Subsystem Inventory

A comprehensive scan of first-party Python source files identified **210 first-party `.py` files** across 12 packages (excluding virtual environments `.venv`, `venv`, `venv311`, `__pycache__`, and `archive`):

| Subsystem / Package | Files | Core Responsibilities & Components |
|---|---|---|
| **`api/`** | 18 | REST routing: `/analyze`, `/ocr`, `/extract`, `/compliance`, `/history`, `/demo`, `/health`, `/report`, `/enforcement`, `/integrations`, `/vision`, `/images`, `/products` |
| **`auth/`** | 5 | PBKDF2-HMAC-SHA256 password hashing, HMAC-SHA256 token signing, RBAC role guards, rate-limiting, account provisioning |
| **`compliance/`** | 14 | Legal Metrology Rules (`LM-001`–`LM-009`), FSSAI Regulations (`FS-001`–`FS-005`), Font size calibration (Rule 12), Risk scoring engine |
| **`database/`** | 3 | Async SQLite database engine (`aiosqlite`), 19 table definitions, indexing, connection pooling, seed fixtures |
| **`demo/`** | 2 | Static benchmark package fixtures (`DEMO_CASES`), metadata catalogs |
| **`enforcement/`** | 4 | Statutory notice generation, penalty calculations, state machine workflows, jurisdiction tracking |
| **`extraction/`** | 5 | Regex-based declaration anchoring, spatial candidate extraction, entity binding |
| **`models/`** | 10 | Pydantic data schemas: `AnalysisResponse`, `ProductInfo`, `ComplianceResult`, `EnforcementCase`, `ArtworkVersion` |
| **`ocr/`** | 5 | OCR Engine Factory, `PaddleOCREngine`, abstract base classes, image text pre-processors |
| **`services/`** | 6 | Analysis pipeline coordinator, PDF report generator (`ReportLab`), SHA-256 integrity ledger |
| **`vision/`** | 9 | OpenCV computer vision pipeline, quality analysis, facet/panel detector, symbol/barcode detection |
| **`tests/`** | 81 | Automated test suites (1,052 unit, integration, and security test cases) |

---

## 3. Systematic Diagnostic Audit Results

### 3.1 Python Syntax & Bytecode Compilation
- **Command:** `python -m py_compile [files]`
- **Scanned Files:** 210 / 210 first-party files
- **Result:** **210 / 210 passed (0 syntax errors, 0 compilation defects)**.

### 3.2 FastAPI Route Table & Conflict Verification
- **Total Fully-Resolved Endpoints:** **141 API routes** across 18 routers
- **Route Collisions / Ambiguities:** **0 duplicate mappings**
- **Route Shadowing Check:** **0 parameterized path shadowing issues** (All static routes such as `/api/demo/samples` and `/api/demo/cases` correctly precede parameterized patterns like `/api/demo/{case_id}`).

### 3.3 Automated Test Suite Baseline
- **Command:** `pytest -v`
- **Total Test Cases Executed:** **1,055 tests** across 48 test suites
- **Status:** **1,052 passed, 3 skipped, 0 failed** in `268.10s (04:28)`
- **Core Verification Suites:**
  - Demo Samples & Routing: `test_demo_samples.py` (**4/4 passed**)
  - End-to-End Demo Readiness: `test_e2e_demo_readiness.py` (**7/7 passed**)
  - OCR Engine Factory & Warmup: `test_ocr.py` (**11/11 passed**)
  - Multi-Tenant Statistics Isolation: `test_sec08_statistics_isolation.py` (**37/37 passed**)
  - Multilingual Key Symmetry: `test_frontend_i18n.py` (**12/12 passed**)

---

## 4. Prioritized Findings & Diagnostics

### Summary by Severity

| Severity | Description | Confirmed Errors | Probable Defects | Potential Risks / Smells |
|---|---|---|---|---|
| **P0 (Critical)** | System crash, authentication bypass, data loss | 0 | 0 | 0 |
| **P1 (High)** | Feature failure under specific runtime inputs | 1 | 0 | 0 |
| **P2 (Medium)** | Log pollution, swallowed exceptions, unhandled edge cases | 0 | 2 | 2 |
| **P3 (Low)** | Untyped response schemas, minor style warnings | 0 | 0 | 2 |

---

### Detailed Findings Catalog

#### [P1 - High] `DEF-001`: NumPy 2.x / OpenCV 5.0 Line Unpacking TypeError in Vision Panel Detector
- **Finding ID:** `DEF-001-VISION-HOUGH-UNPACK`
- **Severity:** **P1 (High)**
- **Classification:** Confirmed Runtime Error
- **Location:** [`backend/vision/panel_detector.py:L63-L65`](file:///d:/SIH/Legal%20Metrology%20Compliance%20AI%20Prototype/backend/vision/panel_detector.py#L63-L65) and [`backend/vision/quality.py:L248-L250`](file:///d:/SIH/Legal%20Metrology%20Compliance%20AI%20Prototype/backend/vision/quality.py#L248-L250)
- **Exact Diagnostic Message:**
  ```
  [VISION] Panel classification error: cannot unpack non-iterable numpy.int32 object
  ```
- **Root Cause:** In NumPy 2.4 / OpenCV 5.0 on Windows, `cv2.HoughLinesP()` returns an array where each item `line` can evaluate to a 1D vector of 4 integers. Executing `x1, y1, x2, y2 = line[0]` attempts to unpack the scalar `int32` element at index 0 rather than the 4 coordinates, raising a `TypeError`.
- **User-Visible Impact:** When processing multi-panel product images, facet edge detection fails and logs a warning, causing the pipeline to fall back to single-panel full-frame classification.
- **Recommended Minimal Fix:**
  ```python
  # Safe coordinate unpacking across 1D and 2D OpenCV line structures
  line_coords = line.reshape(-1)
  if len(line_coords) >= 4:
      x1, y1, x2, y2 = int(line_coords[0]), int(line_coords[1]), int(line_coords[2]), int(line_coords[3])
  ```
- **Required Regression Tests:** `tests/vision/test_vision_pipeline.py` and `tests/vision/test_vision_geometry.py`.
- **Dependencies / Blockers:** None.

---

#### [P2 - Medium] `DEF-002`: Missing Placeholder Image Warning in Report Generation
- **Finding ID:** `DEF-002-REPORT-PLACEHOLDER-WARNING`
- **Severity:** **P2 (Medium)**
- **Classification:** Probable Defect (Log Pollution)
- **Location:** [`backend/services/report_service.py:L255-L260`](file:///d:/SIH/Legal%20Metrology%20Compliance%20AI%20Prototype/backend/services/report_service.py#L255-L260)
- **Exact Diagnostic Message:**
  ```
  Image file not found: d:\SIH\Legal Metrology Compliance AI Prototype\backend\uploads\placeholder.png
  ```
- **Root Cause:** `_load_image()` unconditionally appends any relative image URL to `settings.UPLOAD_DIR`. When demo benchmark cases (which use the synthetic URI `/placeholder.png`) are exported to PDF, `_load_image` logs a warning for each placeholder image.
- **User-Visible Impact:** Backend log spam during demonstration PDF downloads. PDF generation succeeds safely, but logs spurious warnings.
- **Recommended Minimal Fix:**
  ```python
  filename = image_url.split('/')[-1] if '/' in image_url else image_url
  if not filename or filename.lower().startswith('placeholder'):
      return None
  ```
- **Required Regression Tests:** `tests/test_e2e_demo_readiness.py::test_phase_b_04_pdf_report_export`.
- **Dependencies / Blockers:** None.

---

#### [P2 - Medium] `DEF-003`: Silent Exception Swallowing in Auxiliary Production Tasks
- **Finding ID:** `DEF-003-SWALLOWED-EXCEPTIONS`
- **Severity:** **P2 (Medium)**
- **Classification:** Potential Risk / Code Smell
- **Location:** 82 sites across `backend/database/db.py` (38), `backend/api/enforcement.py` (4), `backend/api/history.py` (3), `backend/api/products.py` (3), `backend/api/report.py` (3), `backend/auth/ratelimit.py` (3), `backend/services/` (8).
- **Exact Diagnostic Pattern:**
  ```python
  except Exception:
      pass
  ```
- **Root Cause:** Auxiliary tasks (such as idempotent table/index creation, temporary thumbnail cleanup, optional metadata parsing, and rate-limit redis fallbacks) use bare `except Exception: pass` without logging.
- **User-Visible Impact:** If an unexpected database locking or IO error occurs during index creation or cache synchronization, the error is swallowed without diagnostic trace.
- **Recommended Minimal Fix:** Replace silent `pass` in production code with contextual `logger.debug(...)` or `logger.warning(...)` to maintain transparency while preserving graceful degradation.
- **Required Regression Tests:** Full backend pytest suite.
- **Dependencies / Blockers:** None.

---

#### [P2 - Medium] `DEF-004`: Starlette 1.6 / anyio 4.15 Deprecation Warnings in TestClient
- **Finding ID:** `DEF-004-TESTCLIENT-DEPRECATION`
- **Severity:** **P2 (Medium)**
- **Classification:** Potential Risk (Future Framework Compatibility)
- **Location:** `backend/tests/` (FastAPI TestClient invocations)
- **Exact Diagnostic Message:**
  ```
  StarletteDeprecationWarning: Using 'httpx' with 'starlette.testclient' is deprecated; install 'httpx2' instead.
  DeprecationWarning: The anyio.abc.BlockingPortal alias is deprecated, use anyio.fromthread.BlockingPortal instead.
  ```
- **Root Cause:** Standard deprecation notices emitted by Starlette 1.6 on Python 3.14 when using `TestClient(app)`.
- **User-Visible Impact:** None in production. Test logs show deprecation warnings.
- **Recommended Minimal Fix:** Suppress or update test runner warnings filter in `pytest.ini` / `pyproject.toml`.
- **Required Regression Tests:** `pytest`.
- **Dependencies / Blockers:** None.

---

#### [P3 - Low] `DEF-005`: OpenAPI Untyped Endpoint Responses
- **Finding ID:** `DEF-005-UNTYPED-API-RESPONSES`
- **Severity:** **P3 (Low)**
- **Classification:** Style / API Documentation Enhancement
- **Location:** 55 endpoints across `backend/api/`, `backend/auth/routes.py`, `backend/main.py`
- **Exact Diagnostic Message:** 55 endpoints return raw Python dictionaries or lists without an explicit `response_model=...` parameter in the `@router` decorator.
- **Root Cause:** Endpoints were written returning dynamic dictionaries directly.
- **User-Visible Impact:** Endpoints function correctly, but the interactive Swagger UI (`/docs`) displays generic responses for those 55 routes.
- **Recommended Minimal Fix:** Add explicit Pydantic response models to administrative and auxiliary endpoints where schemas are standardized.
- **Required Regression Tests:** `tests/test_audit_demo_and_admin_credential_change.py`.
- **Dependencies / Blockers:** None.

---

#### [P3 - Low] `ENV-001`: PaddleOCR C++ Dependency Unavailable on Windows Python 3.14
- **Finding ID:** `ENV-001-PADDLEOCR-PYTHON314`
- **Severity:** **P3 (Low / Environment Limitation)**
- **Classification:** Environmental Constraint (Gracefully Handled)
- **Location:** [`backend/ocr/paddle_engine.py`](file:///d:/SIH/Legal%20Metrology%20Compliance%20AI%20Prototype/backend/ocr/paddle_engine.py) & [`backend/ocr/factory.py`](file:///d:/SIH/Legal%20Metrology%20Compliance%20AI%20Prototype/backend/ocr/factory.py)
- **Exact Diagnostic Message:**
  ```
  PaddleOCR is not available or dependencies (paddleocr, paddlepaddle) are not installed.
  ```
- **Root Cause:** The `paddlepaddle` C++ binary package has not released official pre-built wheels for Python 3.14 on Windows.
- **Mitigation Status:** Fully mitigated. MetrCheck AI's OCR factory gracefully catches import errors, reports `ocr_ready: false` in `/api/health`, and falls back to regex/spatial extraction heuristics and precomputed benchmark scenarios without crashing.

---

## 5. Top 5 Recommended Remediation Actions (Phase 2 Roadmap)

1. **Fix NumPy 2.x Line Coordinate Unpacking in Vision Pipeline (`DEF-001`):**
   Update [`backend/vision/panel_detector.py`](file:///d:/SIH/Legal%20Metrology%20Compliance%20AI%20Prototype/backend/vision/panel_detector.py) and [`backend/vision/quality.py`](file:///d:/SIH/Legal%20Metrology%20Compliance%20AI%20Prototype/backend/vision/quality.py) to use safe `.reshape(-1)` coordinate indexing, eliminating the `TypeError` and restoring facet splitting.
2. **Suppress Spurious Placeholder Warnings in Report Generation (`DEF-002`):**
   Add a placeholder check in [`backend/services/report_service.py`](file:///d:/SIH/Legal%20Metrology%20Compliance%20AI%20Prototype/backend/services/report_service.py) `_load_image()` to prevent warning logs during demo PDF exports.
3. **Add Structured Logging to Swallowed Exception Handlers (`DEF-003`):**
   Replace silent `pass` with `logger.debug(...)` across `backend/database/db.py` and `backend/api/` to ensure full operational observability.
4. **Clean up TestClient Deprecation Warning Filters (`DEF-004`):**
   Configure standard pytest warning filters in `backend/pytest.ini` for clean test runs on Python 3.14.
5. **Add Explicit Response Models to High-Traffic Endpoints (`DEF-005`):**
   Add explicit Pydantic return schemas for remaining untyped routes in `backend/api/` to maximize Swagger documentation accuracy.

---

## 6. Blocked Checks & Environment Limitations

- **PaddleOCR Local Inference on Python 3.14 Windows:** Native GPU/CPU PaddleOCR wheel compilation is blocked due to upstream `paddlepaddle` Python 3.14 wheel availability on Windows. All fallback, health, and precomputed demo paths are verified and working.
- **No Other Checks Blocked:** Full backend test suite (1,052 tests), FastAPI lifespan startup, SQLite database transactions, RBAC role matrix, and report generators are 100% executable and verified.

---

## 7. Confirmation of Read-Only Execution

- **Zero Source Files Modified:** No production code, test files, dependencies, database tables, or environment configurations were altered during this audit.
- **Working Tree Preserved:** Git status and all previously verified sprint changes remain 100% intact.
- **Next Step:** Ready for user approval of the Phase 2 repair plan before applying targeted fixes.
