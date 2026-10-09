import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_demo_samples_catalog():
    """Verify GET /api/demo/samples returns verified demo packaging samples."""
    response = client.get("/api/demo/samples")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 2

    sample_ids = [s["id"] for s in data]
    assert "alpino_oats" in sample_ids
    assert "takatak_snacks" in sample_ids

    # Verify Alpino sample metadata
    alpino = next(s for s in data if s["id"] == "alpino_oats")
    assert alpino["badge"] == "COMPLIANT"
    assert len(alpino["panels"]) == 2
    panel_slots = [p["slot"] for p in alpino["panels"]]
    assert "front" in panel_slots
    assert "back" in panel_slots

    # Verify Tak-a-Tak sample metadata
    takatak = next(s for s in data if s["id"] == "takatak_snacks")
    assert takatak["badge"] == "DEFICIENT"
    assert len(takatak["panels"]) == 2


def test_demo_sample_image_serving():
    """Verify GET /api/demo/sample-image/{filename} serves fixture image content."""
    # Test Alpino front PNG
    resp = client.get("/api/demo/sample-image/alpino_front.png")
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("image/png")
    assert len(resp.content) > 1000

    # Test Takatak front JPEG
    resp = client.get("/api/demo/sample-image/takatak_front.jpeg")
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("image/jpeg")
    assert len(resp.content) > 1000


def test_demo_sample_image_security():
    """Verify security controls: path traversal and unwhitelisted files return 404."""
    # Non-existent file
    resp = client.get("/api/demo/sample-image/nonexistent_file.png")
    assert resp.status_code == 404

    # Traversal attempt
    resp = client.get("/api/demo/sample-image/..%2Fmain.py")
    assert resp.status_code in (404, 400)


def test_demo_precomputed_cases_routing_integrity():
    """Verify GET /api/demo/{case_id} still works and does not conflict with /demo/samples."""
    for case_id in [1, 2, 3]:
        resp = client.get(f"/api/demo/{case_id}")
        assert resp.status_code == 200
        data = resp.json()
        assert "id" in data
        assert "compliance_result" in data
        assert "score" in data["compliance_result"]
        assert "status" in data["compliance_result"]

    # Invalid case_id returns 404
    resp = client.get("/api/demo/999")
    assert resp.status_code == 404
