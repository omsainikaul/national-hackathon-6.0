# Documentation Assets (`doc_assets/`)

This directory is designated for architectural flowcharts, statutory rule diagrams, and system topology graphics referenced across MetrCheck AI documentation and PDF dossier generators.

---

## 1. Directory Purpose

The `doc_assets/` directory acts as the asset repository and destination folder for system diagrams supporting the MetrCheck AI platform. These visuals illustrate the end-to-end data processing pipeline, modular 5-layer architecture, statutory rule evaluation matrix, and role-based access control (RBAC) security hierarchy.

---

## 2. Diagram Inventory & Verification Status

The directory contains four tracked binary placeholder files. Inspection of file signatures and byte streams confirms that the tracked files are **not valid, viewable PNG images** (each file begins with the byte sequence `3C-D1-88-1C-34...` rather than the standard 8-byte PNG file signature `\x89PNG\r\n\x1a\n`, and cannot be loaded by image parsers such as Pillow).

The table below summarizes each file's verified intended subject and generation source:

| File Name | File Size | Verified Status | Intended Subject (Verified via Generators) | Generator Script |
| :--- | :---: | :---: | :--- | :--- |
| `architecture_diagram.png` | 22 B | Binary stub (Non-PNG) | **5-Layer System Architecture & Component Topology**<br/>Illustrates UI (React 19), REST API Gateway (FastAPI), Computer Vision & Extraction, Statutory Rule Engine, and Persistence/Export layers. | [`../scripts/generate_diagrams.py`](../scripts/generate_diagrams.py) |
| `compliance_tree_diagram.png` | 45 B | Binary stub (Non-PNG) | **Statutory Compliance & Scoring Decision Matrix**<br/>Details codified Legal Metrology rules (LM-001 to LM-009), FSSAI regulations (FS-001 to FS-005), and weighted scoring logic. | [`../scripts/generate_more_diagrams.py`](../scripts/generate_more_diagrams.py) |
| `pipeline_diagram.png` | 144 B | Binary stub (Non-PNG) | **End-to-End Data Processing & Compliance Pipeline**<br/>Maps the 7-stage workflow: (1) Ingestion, (2) Preprocessing, (3) OCR & Detection, (4) Extraction, (5) Compliance, (6) Scoring, (7) Enforcement & Reporting. | [`../scripts/generate_diagrams.py`](../scripts/generate_diagrams.py) |
| `rbac_security_diagram.png` | 104 B | Binary stub (Non-PNG) | **Security & Role-Based Access Control (RBAC)**<br/>Visualizes cryptographic auth primitives and access boundaries for System Administrator, Enforcement Officer, and Merchant roles. | [`../scripts/generate_more_diagrams.py`](../scripts/generate_more_diagrams.py) |

*Note: Intended subjects are confirmed directly from inspection of the generator functions (`create_pipeline_diagram`, `create_architecture_diagram`, `create_compliance_decision_diagram`, `create_rbac_diagram`) and their incorporation logic in [`../scripts/generate_architecture_pdf.py`](../scripts/generate_architecture_pdf.py).*

---

## 3. Visual Generation & Usage Scripts

Documentation graphics are programmatically generated and embedded into compiled dossiers via the following Python scripts located in `scripts/`:

1. **[`../scripts/generate_diagrams.py`](../scripts/generate_diagrams.py)**
   * Functions: `create_pipeline_diagram()` and `create_architecture_diagram()`.
   * Responsibility: Uses Pillow (`PIL.Image`, `PIL.ImageDraw`) to render the 7-stage pipeline card flowchart and the 5-layer architecture diagram to `doc_assets/`.

2. **[`../scripts/generate_more_diagrams.py`](../scripts/generate_more_diagrams.py)**
   * Functions: `create_compliance_decision_diagram()` and `create_rbac_diagram()`.
   * Responsibility: Uses Pillow to render the statutory rule/scoring decision matrix and the 3-tier RBAC security hierarchy to `doc_assets/`.

3. **[`../scripts/generate_architecture_pdf.py`](../scripts/generate_architecture_pdf.py)**
   * Responsibility: Compiles the comprehensive architectural specification PDF dossier. Inspects `doc_assets/` using `os.path.exists()` and conditionally embeds all four diagrams into Sections 1, 2, 3, and 4 of the generated document.

---

## 4. Regeneration Instructions

To render full-resolution PNG images from source specifications without modifying tracked binaries in git:

```bash
# Ensure Pillow is installed in the active environment
python -m pip install pillow

# Generate primary pipeline and architecture diagrams
python scripts/generate_diagrams.py

# Generate supplementary compliance decision and RBAC security diagrams
python scripts/generate_more_diagrams.py
```
