# METRCHECK AI — FINAL PROJECT CLEANUP PLAN
**Event:** National Hackathon 6.0  
**Project:** MetrCheck AI — Legal Metrology Compliance AI Platform  
**Document ID:** `FINAL_CLEANUP_PLAN.md`  
**Date / Timestamp:** October 2026 (Local: 2026-10-09T22:53:00+05:30)  
**Status:** Pre-Execution Cleanup Plan  

---

## 1. Inventory and Risk Classification Framework

This cleanup plan establishes a safe, evidence-based strategy to remove confirmed disposable caches, temporary build artifacts, and obsolete local files without altering application logic, compromising audit integrity, or endangering project reproducibility for **National Hackathon 6.0**.

### Risk Classification Levels:
- **Low Risk:** Confirmed disposable bytecode caches (`__pycache__`), test runtime caches (`.pytest_cache`), empty temporary directories (`scratch/`), and obsolete non-referenced local dev notes (`.omp_tasks/`).
- **Medium Risk:** Backup configuration files (`.env.paddle-backup`), unreferenced documentation dumps.
- **High Risk:** Core source files, active databases, database migrations, model files, test fixtures, demo samples, dependency manifests, lockfiles, and audit reports.
- **Uncertain:** Any artifact whose purpose or downstream reference is ambiguous. **Action: PRESERVE.**

---

## 2. Comprehensive Candidate Item Matrix

| File / Directory Path | Category | Evidence & Analysis | Dependencies | Proposed Action | Risk Level |
| :--- | :--- | :--- | :--- | :---: | :---: |
| `__pycache__/` (Root & all backend packages) | Python Bytecode Cache | Ephemeral `.pyc` files generated at runtime by Python interpreter. 100% regenerable. | None (runtime generated) | **DELETE** | Low |
| `.pytest_cache/` (Root & `backend/.pytest_cache/`) | Test Execution Cache | Ephemeral pytest tracking cache. 100% regenerable on test invocation. | None (runtime generated) | **DELETE** | Low |
| `scratch/` | Empty Temp Directory | Empty directory used for temporary scratch files. Contains 0 files. | None | **DELETE** | Low |
| `.omp_tasks/` | Obsolete Local Task Notes | 5 temporary markdown notes (`t1`–`t5`) from prior internal task sessions. Already gitignored. | None | **DELETE** | Low |
| `backend/.env.paddle-backup` | Backup Config File | Legacy environment configuration backup specifying local Tesseract paths. Official template is `.env.example`. | None | **DELETE** | Medium |
| `backend/archive/db_backups/` | Historical DB Snapshots | 3 timestamped SQLite backups from September 2026 migrations. Already gitignored. | Historical audit reference | **PRESERVE** | High |
| `backend/uploads/` | Image Evidence Store | 81 packaging image uploads referenced by database foreign keys and evidence tokens. | DB records & test data | **PRESERVE** | High |
| `frontend/public/demo-samples/` | Demo Static Assets | 10 pre-calibrated benchmark package images (`alpino_front.png`, etc.) used in demo mode. | `DemoCases.tsx`, `/api/demo` | **PRESERVE** | High |
| `test_data/` | Test Fixtures & Benchmarks | Benchmark datasets, sample images, and OCR benchmark scripts. | Test suites | **PRESERVE** | High |
| `docs/` & `doc_assets/` | Architecture Documentation | Architecture diagrams, Section 4–17 implementation reports, interactive guide. | Documentation / Review | **PRESERVE** | High |
| `scripts/` | Diagram Generation Tools | ReportLab and diagram rendering helper scripts. | Build / docs | **PRESERVE** | High |
| `frontend/dist/` | Production Build Assets | Pre-compiled Vite production bundle (`445.57 kB`). Gitignored. | Static preview / Docker | **PRESERVE** | High |
| `backend/metrc_check.db*` | Active SQLite Database | Active database file, WAL index, and shared memory files. | Entire backend runtime | **PRESERVE** | High |
| Virtual Environments (`venv/`, `.venv/`, `node_modules/`) | Environment Runtimes | Installed Python packages and Node.js dependencies. | Runtime & execution | **PRESERVE** | High |
| Audit Reports (`FINAL_*.md`, `*AUDIT.md`) | Historical Evidence | Authoritative pre-freeze and stabilization evidence documents. | Compliance history | **PRESERVE** | High |

---

## 3. Approved Low-Risk Deletion Scope

The following items are confirmed for safe removal in Phase D:
1. **24 `__pycache__` directories** across the root and `backend/` subpackages.
2. **2 `.pytest_cache/` directories** in repository root and `backend/`.
3. **`scratch/`** empty temporary folder.
4. **`.omp_tasks/`** folder containing 5 obsolete dev notes.
5. **`backend/.env.paddle-backup`** unused legacy backup file.

---
*End of Plan — MetrCheck AI Final Cleanup Plan*
