import pytest
import io
import json
from pathlib import Path
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

SAMPLE_DIR = Path(__file__).resolve().parent.parent.parent / "frontend" / "public" / "demo-samples"

def test_phase_b_01_backend_health_and_ocr_readiness():
    """Phase B.2: Confirm backend health endpoint responds and reports OCR readiness truthfully."""
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("status") in ["ok", "degraded", "healthy"]
    assert "ocr_ready" in data
    assert "ocr_engine" in data

def test_phase_b_02_demo_sample_fixtures_availability():
    """Phase B.4-5: Verify demo sample fixtures exist and serve valid image bytes."""
    resp = client.get("/api/demo/samples")
    assert resp.status_code == 200
    samples = resp.json()
    assert len(samples) >= 2
    
    # Verify Alpino reference sample
    alpino = next((s for s in samples if s["id"] == "alpino_oats"), None)
    assert alpino is not None
    assert len(alpino["panels"]) >= 2
    for panel in alpino["panels"]:
        img_path = SAMPLE_DIR / panel["filename"]
        assert img_path.exists(), f"Image file {img_path} must exist"
        assert img_path.stat().st_size > 1000

def test_phase_b_03_live_analysis_alpino_reference():
    """Phase B.6-8: Execute live analysis using real sample images through POST /api/analyze."""
    front_path = SAMPLE_DIR / "alpino_front.png"
    back_path = SAMPLE_DIR / "alpino_back.png"
    assert front_path.exists()
    assert back_path.exists()

    with open(front_path, "rb") as f_front, open(back_path, "rb") as f_back:
        files = [
            ("files", ("alpino_front.png", f_front.read(), "image/png")),
            ("files", ("alpino_back.png", f_back.read(), "image/png"))
        ]
        data_form = {
            "labels": json.dumps(["Front", "Back"])
        }
        resp = client.post("/api/analyze", files=files, data=data_form)
    
    assert resp.status_code == 200
    data = resp.json()
    assert "id" in data
    assert data.get("id") is not None
    # Confirm it is a live analysis result (not demo- prefixed)
    assert not str(data["id"]).startswith("demo-")
    assert "compliance_result" in data
    assert "product_info" in data
    
    cr = data["compliance_result"]
    assert "score" in cr
    assert "checks" in cr
    assert len(cr["checks"]) > 0

    # Verify images exist and contain metadata
    images = data.get("images", [])
    assert len(images) == 2
    for img in images:
        assert "image_url" in img
        assert "label" in img

def test_phase_b_04_pdf_report_export():
    """Phase B.9-10: Verify PDF and CSV report exports for English and Hindi."""
    # Test precomputed benchmark PDF generation
    pdf_resp = client.get("/api/report/demo-1/pdf?lang=en")
    assert pdf_resp.status_code == 200
    assert pdf_resp.headers["content-type"] == "application/pdf"
    assert len(pdf_resp.content) > 1000
    # PDF header magic bytes %PDF-
    assert pdf_resp.content.startswith(b"%PDF-")

    # Test Hindi PDF export
    pdf_hi_resp = client.get("/api/report/demo-1/pdf?lang=hi")
    assert pdf_hi_resp.status_code == 200
    assert pdf_hi_resp.headers["content-type"] == "application/pdf"
    assert len(pdf_hi_resp.content) > 1000
    assert pdf_hi_resp.content.startswith(b"%PDF-")

    # Test CSV report export
    csv_resp = client.get("/api/report/demo-1/csv")
    assert csv_resp.status_code == 200
    assert "text/csv" in csv_resp.headers["content-type"]
    assert b"METRCHECK AI" in csv_resp.content

def test_phase_c_01_live_analysis_deficient_label():
    """Phase C: Execute live analysis on deficient label sample and verify findings."""
    front_path = SAMPLE_DIR / "takatak_front.jpeg"
    back_path = SAMPLE_DIR / "takatak_back.jpeg"
    assert front_path.exists()
    assert back_path.exists()

    with open(front_path, "rb") as f_front, open(back_path, "rb") as f_back:
        files = [
            ("files", ("takatak_front.jpeg", f_front.read(), "image/jpeg")),
            ("files", ("takatak_back.jpeg", f_back.read(), "image/jpeg"))
        ]
        data_form = {
            "labels": json.dumps(["Front", "Back"])
        }
        resp = client.post("/api/analyze", files=files, data=data_form)

    assert resp.status_code == 200
    data = resp.json()
    assert "id" in data
    assert not str(data["id"]).startswith("demo-")
    cr = data["compliance_result"]
    assert "checks" in cr
    assert len(cr["checks"]) > 0

def test_phase_d_01_precomputed_demo_benchmarks():
    """Phase D: Verify precomputed demo benchmark fixtures and provenance."""
    for case_id in ["1", "2", "3"]:
        resp = client.get(f"/api/demo/{case_id}")
        assert resp.status_code == 200
        data = resp.json()
        assert data.get("id") == f"demo-{case_id}"
        assert data.get("product_info", {}).get("extraction_mode") == "demo"
        assert "compliance_result" in data
        assert "checks" in data["compliance_result"]

def test_phase_e_01_error_handling_and_recovery():
    """Phase E: Test invalid inputs and recovery behavior."""
    # Invalid demo case ID
    resp = client.get("/api/demo/999")
    assert resp.status_code == 404

    # Empty image payload to /api/analyze
    resp = client.post("/api/analyze", files=[])
    assert resp.status_code in [400, 422]
