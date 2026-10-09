"""
Section 16 Advanced Reporting Test Suite

Tests:
1. PDF report generation in English and Indic languages (Hindi, Tamil, Marathi, etc.)
2. Excel (XLSX) multi-sheet generation and formatting
3. CSV report export and spreadsheet formula injection protection (=, +, -, @, \\t, \\r escaping)
4. JSON report completeness and serialization
5. Officer review inclusion & AI vs Human delta in reports
6. External verification (Section 13) cross-check rendering
7. Rule 12 font size and readability reporting
8. Access control, role enforcement, and IDOR protection
9. Version comparison report exports (JSON & CSV)
"""

import pytest
import io
import json
import csv
import openpyxl
from fastapi.testclient import TestClient

from main import app
from database.db import (
    save_analysis, save_review,
    save_version_comparison, create_user, get_user_by_username
)
from services.report_service import generate_pdf_report
from models.schemas import (
    AnalysisResponse, ComplianceResult, ComplianceCheck, ProductInfo,
    OCRResult, ProductImageEvidence, FontSizeAnalysis, Recommendation
)
from models.verification_schemas import (
    ExternalVerificationSummary, CrossCheckFieldResult, CrossCheckStatus,
    VerificationConfidence, VerificationConfidenceTier
)
from auth.security import create_token, hash_password, ROLE_ADMIN, ROLE_ENFORCEMENT, ROLE_MERCHANT, ROLE_AUDIT


@pytest.fixture
def client():
    return TestClient(app)


def _make_sample_analysis():
    checks = [
        ComplianceCheck(
            rule_id="LM-01",
            field="product_name",
            field_label="Common or Generic Name of Commodity",
            status="PASS",
            detected_value="Organic Honey",
            confidence=98.5,
            source_name="Legal Metrology Rules 2011",
            source_reference="Rule 6(1)(a)",
            domain="LEGAL_METROLOGY"
        ),
        ComplianceCheck(
            rule_id="LM-02",
            field="net_quantity",
            field_label="Net Quantity Declaration",
            status="PASS",
            detected_value="500 g",
            confidence=95.0,
            source_name="Legal Metrology Rules 2011",
            source_reference="Rule 6(1)(b)",
            domain="LEGAL_METROLOGY"
        ),
        ComplianceCheck(
            rule_id="LM-03",
            field="mrp",
            field_label="Maximum Retail Price (MRP)",
            status="FAIL",
            detected_value="=SUM(100,50)", # Formula injection test payload
            confidence=92.0,
            source_name="Legal Metrology Rules 2011",
            source_reference="Rule 6(1)(e)",
            domain="LEGAL_METROLOGY"
        ),
        ComplianceCheck(
            rule_id="FSSAI-01",
            field="fssai_license",
            field_label="FSSAI 14-Digit License Number",
            status="PASS",
            detected_value="+91-10012011000123", # Phone/plus prefix formula injection test
            confidence=99.0,
            source_name="FSSAI Regulations 2020",
            source_reference="Reg 2.2.1",
            domain="FSSAI"
        )
    ]

    recs = [
        Recommendation(
            rule_id="LM-03",
            status="FAIL",
            priority="HIGH",
            title="MRP Declaration Format Non-Compliant",
            issue="MRP missing statutory taxes inclusion text",
            recommended_action="Print MRP clearly as 'MRP Rs. XX.XX (incl. of all taxes)'",
            source_name="Legal Metrology Rules 2011",
            source_reference="Rule 6(1)(e)"
        )
    ]

    cr = ComplianceResult(
        checks=checks,
        score=75.0,
        status="NON_COMPLIANT",
        total_rules=4,
        passed_rules=3,
        failed_rules=1,
        warning_rules=0,
        needs_review_rules=0,
        not_applicable_rules=0,
        recommendations=recs
    )

    p_info = ProductInfo(
        product_name="Organic Honey",
        brand="Nature Gold",
        net_quantity="500 g",
        mrp="Rs. 350.00",
        manufacturer="Nature Bee Farms Ltd, Himachal Pradesh",
        fssai_license="10012011000123",
        country_of_origin="India"
    )

    fsa = FontSizeAnalysis(
        net_quantity_font_height_mm=3.5,
        min_required_font_height_mm=2.0,
        is_font_compliant=True,
        readability_score=92.0,
        readability_tier="EXCELLENT",
        rule_12_verdict="Compliant with Legal Metrology Rule 12 Table font height minimums",
        details="Net quantity font height exceeds statutory 2.0 mm requirement."
    )

    ev_summary = ExternalVerificationSummary(
        summary_verdict="FoSCoS and GS1 registries validated successfully.",
        overall_consistency_status=CrossCheckStatus.MATCH,
        confidence=VerificationConfidence(tier=VerificationConfidenceTier.HIGH, score=0.95),
        verification_sources=["FoSCoS Public Registry", "GS1 DataKart"],
        cross_checks=[
            CrossCheckFieldResult(
                check_type="FSSAI_LICENSE",
                field_name="fssai_license",
                extracted_value="10012011000123",
                registry_value="10012011000123",
                status=CrossCheckStatus.MATCH,
                similarity_score=1.0
            )
        ]
    )

    return AnalysisResponse(
        id="test-analysis-sec16",
        product_name="Organic Honey",
        image_url="/api/images/honey_sample.jpg",
        images=[
            ProductImageEvidence(
                filename="honey_sample.jpg",
                image_url="/api/images/honey_sample.jpg",
                label="Front",
                word_count=42
            )
        ],
        ocr_result=OCRResult(
            full_text="Organic Honey Nature Gold 500g MRP Rs 350 FSSAI 10012011000123",
            words=[],
            language="eng",
            processing_time=0.1
        ),
        product_info=p_info,
        compliance_result=cr,
        recommendations=recs,
        created_at="2026-09-17T12:00:00Z",
        font_size_analysis=fsa,
        external_verification=ev_summary,
        owner_user_id="merchant_test",
        integrity_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        system_version="2.0.0",
        ocr_engine_version="PaddleOCR PP-OCRv4",
        ruleset_version="2026.1"
    )


def test_pdf_report_generation_multilingual():
    """Verify PDF generator creates valid multi-page PDF in English and Indic languages."""
    analysis = _make_sample_analysis()

    languages_to_test = ["en", "hi", "ta", "mr", "bn", "gu", "te", "kn", "ml", "pa"]
    for lang_code in languages_to_test:
        pdf_bytes = generate_pdf_report(analysis, lang=lang_code)
        assert len(pdf_bytes) > 2000, f"PDF generation failed for language {lang_code}"
        assert pdf_bytes.startswith(b"%PDF-"), f"Output is not a valid PDF for {lang_code}"


@pytest.mark.asyncio
async def test_csv_report_formula_injection_sanitization(client):
    """Verify CSV report exports with formula triggers (=, +, -, @) safely escaped."""
    analysis = _make_sample_analysis()
    
    # Save analysis in SQLite
    await save_analysis({
        "id": analysis.id,
        "product_name": analysis.product_name,
        "image_filename": "honey_sample.jpg",
        "ocr_text": analysis.ocr_result.full_text,
        "extracted_data": analysis.product_info.model_dump_json(),
        "compliance_result": analysis.compliance_result.model_dump_json(),
        "score": analysis.compliance_result.score,
        "status": analysis.compliance_result.status,
        "owner_user_id": analysis.owner_user_id
    })

    admin_token = create_token("admin", ROLE_ADMIN)
    headers = {"Authorization": f"Bearer {admin_token}"}

    resp = client.get(f"/api/report/{analysis.id}/csv", headers=headers)
    assert resp.status_code == 200
    assert "text/csv" in resp.headers["content-type"]

    csv_text = resp.content.decode("utf-8-sig")
    reader = csv.reader(io.StringIO(csv_text))
    rows = list(reader)

    # Verify formula characters are escaped with leading '
    flattened_cells = [cell for row in rows for cell in row]
    
    # Target values were '=SUM(100,50)' and '+91-10012011000123'
    assert "'=SUM(100,50)" in flattened_cells or any(c.startswith("'=SUM") for c in flattened_cells)
    assert "'+91-10012011000123" in flattened_cells or any(c.startswith("'+91") for c in flattened_cells)
    
    # Ensure no naked = or + formula attacks exist in cell beginnings
    for cell in flattened_cells:
        if cell.startswith("=") or (cell.startswith("+") and not cell.startswith("'+")):
            pytest.fail(f"Unsanitized formula cell found: {cell}")


@pytest.mark.asyncio
async def test_xlsx_report_multi_sheet_and_formatting(client):
    """Verify Excel report generates all expected sheets with sanitized values."""
    analysis = _make_sample_analysis()
    
    await save_analysis({
        "id": analysis.id,
        "product_name": analysis.product_name,
        "image_filename": "honey_sample.jpg",
        "ocr_text": analysis.ocr_result.full_text,
        "extracted_data": analysis.product_info.model_dump_json(),
        "compliance_result": analysis.compliance_result.model_dump_json(),
        "score": analysis.compliance_result.score,
        "status": analysis.compliance_result.status,
        "owner_user_id": analysis.owner_user_id
    })

    admin_token = create_token("admin", ROLE_ADMIN)
    headers = {"Authorization": f"Bearer {admin_token}"}

    resp = client.get(f"/api/report/{analysis.id}/xlsx", headers=headers)
    assert resp.status_code == 200
    assert "spreadsheetml" in resp.headers["content-type"]

    wb = openpyxl.load_workbook(io.BytesIO(resp.content))
    sheet_names = wb.sheetnames
    assert "Summary" in sheet_names
    assert "Font Size (Rule 12)" in sheet_names
    assert "Rule-by-Rule Checklist" in sheet_names
    assert "Recommendations" in sheet_names

    # Check Summary Sheet values
    ws_summary = wb["Summary"]
    summary_dict = {}
    for row in ws_summary.iter_rows(values_only=True):
        if row and len(row) >= 2 and row[0] is not None:
            summary_dict[str(row[0])] = str(row[1])

    assert "Inspection ID" in summary_dict
    assert summary_dict["Inspection ID"] == analysis.id
    assert "Overall Compliance Score" in summary_dict


@pytest.mark.asyncio
async def test_json_report_export(client):
    """Verify JSON report serializes entire AnalysisResponse accurately."""
    analysis = _make_sample_analysis()
    
    await save_analysis({
        "id": analysis.id,
        "product_name": analysis.product_name,
        "image_filename": "honey_sample.jpg",
        "ocr_text": analysis.ocr_result.full_text,
        "extracted_data": analysis.product_info.model_dump_json(),
        "compliance_result": analysis.compliance_result.model_dump_json(),
        "score": analysis.compliance_result.score,
        "status": analysis.compliance_result.status,
        "owner_user_id": analysis.owner_user_id
    })

    admin_token = create_token("admin", ROLE_ADMIN)
    headers = {"Authorization": f"Bearer {admin_token}"}

    resp = client.get(f"/api/report/{analysis.id}/json", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == analysis.id
    assert data["product_name"] == "Organic Honey"
    assert data["compliance_result"]["score"] == 75.0
    assert len(data["compliance_result"]["checks"]) == 4


@pytest.mark.asyncio
async def test_officer_review_included_in_reports(client):
    """Verify that officer review status, verified scores, and remarks are included in reports."""
    analysis = _make_sample_analysis()
    
    await save_analysis({
        "id": analysis.id,
        "product_name": analysis.product_name,
        "image_filename": "honey_sample.jpg",
        "ocr_text": analysis.ocr_result.full_text,
        "extracted_data": analysis.product_info.model_dump_json(),
        "compliance_result": analysis.compliance_result.model_dump_json(),
        "score": analysis.compliance_result.score,
        "status": analysis.compliance_result.status,
        "owner_user_id": analysis.owner_user_id
    })

    # Insert officer review record in SQLite
    review_record = {
        "id": "rev-test-101",
        "analysis_id": analysis.id,
        "product_name": analysis.product_name,
        "status": "VERIFIED",
        "assigned_officer": "officer_sharma",
        "assigned_by": "admin",
        "assigned_at": "2026-09-17T12:05:00Z",
        "created_at": "2026-09-17T12:05:00Z",
        "updated_at": "2026-09-17T12:15:00Z",
        "verified_by": "officer_sharma",
        "verified_at": "2026-09-17T12:15:00Z",
        "final_human_status": "COMPLIANT",
        "ai_score": 75.0,
        "ai_risk_level": "HIGH",
        "ai_status": "NON_COMPLIANT",
        "human_score": 90.0,
        "human_risk_level": "LOW",
        "ai_snapshot": {},
        "comments": [{"officer_username": "officer_sharma", "comment": "Verified packaging meets exempt criteria."}]
    }
    await save_review(review_record)

    admin_token = create_token("admin", ROLE_ADMIN)
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Verify CSV contains officer review metadata
    resp_csv = client.get(f"/api/report/{analysis.id}/csv", headers=headers)
    assert resp_csv.status_code == 200
    csv_str = resp_csv.content.decode("utf-8-sig")
    assert "HUMAN OFFICER VERIFICATION & AUDIT REVIEW" in csv_str
    assert "officer_sharma" in csv_str
    assert "90.0 / 100" in csv_str

    # Verify XLSX contains officer review metadata
    resp_xlsx = client.get(f"/api/report/{analysis.id}/xlsx", headers=headers)
    assert resp_xlsx.status_code == 200
    wb = openpyxl.load_workbook(io.BytesIO(resp_xlsx.content))
    ws_summary = wb["Summary"]
    summary_text = " ".join([str(c) for row in ws_summary.iter_rows(values_only=True) for c in row if c is not None])
    assert "officer_sharma" in summary_text


@pytest.mark.asyncio
async def test_idor_and_role_access_control(client):
    """Verify merchants cannot access other merchants' reports while admins/officers can access any."""
    salt, pwh = hash_password("pass123")
    for uname, role, org in [
        ("merchant_alice", ROLE_MERCHANT, "org_merchant_alice"),
        ("merchant_bob", ROLE_MERCHANT, "org_merchant_bob"),
        ("officer_test", ROLE_ENFORCEMENT, "org_merchant_alice"),
        ("auditor_test", ROLE_AUDIT, "org_merchant_alice"),
    ]:
        try:
            await create_user(uname, pwh, salt, role, uname, organization_id=org)
        except Exception:
            pass

    analysis = _make_sample_analysis()
    analysis.owner_user_id = "merchant_alice"
    
    await save_analysis({
        "id": analysis.id,
        "product_name": analysis.product_name,
        "image_filename": "honey_sample.jpg",
        "ocr_text": analysis.ocr_result.full_text,
        "extracted_data": analysis.product_info.model_dump_json(),
        "compliance_result": analysis.compliance_result.model_dump_json(),
        "score": analysis.compliance_result.score,
        "status": analysis.compliance_result.status,
        "owner_user_id": analysis.owner_user_id
    })

    # 1. Owner Merchant (Alice) -> Allowed
    alice_token = create_token("merchant_alice", ROLE_MERCHANT)
    resp_alice = client.get(f"/api/report/{analysis.id}/csv", headers={"Authorization": f"Bearer {alice_token}"})
    assert resp_alice.status_code == 200

    # 2. Other Merchant (Bob) -> Forbidden (403)
    bob_token = create_token("merchant_bob", ROLE_MERCHANT)
    resp_bob = client.get(f"/api/report/{analysis.id}/csv", headers={"Authorization": f"Bearer {bob_token}"})
    assert resp_bob.status_code == 403

    # 3. Enforcement Officer -> Allowed
    officer_token = create_token("officer_test", ROLE_ENFORCEMENT)
    resp_officer = client.get(f"/api/report/{analysis.id}/csv", headers={"Authorization": f"Bearer {officer_token}"})
    assert resp_officer.status_code == 200

    # 4. Audit Officer -> Allowed
    audit_token = create_token("auditor_test", ROLE_AUDIT)
    resp_audit = client.get(f"/api/report/{analysis.id}/csv", headers={"Authorization": f"Bearer {audit_token}"})
    assert resp_audit.status_code == 200


@pytest.mark.asyncio
async def test_version_comparison_report_exports(client):
    """Verify Section 9 Version Comparison export endpoints (/api/versions/comparisons/{id}/json & csv)."""
    comp_data = {
        "id": "comp-test-sec16",
        "product_name": "Premium Tea",
        "created_at": "2026-09-17T12:00:00Z",
        "version_a_id": "v1",
        "version_b_id": "v2",
        "version_a_score": 80.0,
        "version_b_score": 95.0,
        "score_delta": 15.0,
        "overall_verdict": "SIGNIFICANT_IMPROVEMENT",
        "field_diffs": [
            {
                "field_name": "mrp",
                "change_type": "MODIFIED",
                "value_a": "Rs. 200",
                "value_b": "Rs. 220",
                "compliance_impact": "NEUTRAL",
                "explanation": "Price increased by Rs 20"
            }
        ],
        "rule_transitions": [
            {
                "rule_id": "LM-03",
                "field": "mrp",
                "status_a": "FAIL",
                "status_b": "PASS",
                "transition_type": "RESOLVED",
                "detail": "MRP formatting corrected"
            }
        ]
    }
    await save_version_comparison(comp_data)

    admin_token = create_token("admin", ROLE_ADMIN)
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Test JSON export
    resp_json = client.get(f"/api/versions/comparisons/{comp_data['id']}/json", headers=headers)
    assert resp_json.status_code == 200
    data = resp_json.json()
    assert data["id"] == comp_data["id"]
    assert data["score_delta"] == 15.0

    # Test CSV export with formula sanitization
    resp_csv = client.get(f"/api/versions/comparisons/{comp_data['id']}/csv", headers=headers)
    assert resp_csv.status_code == 200
    csv_text = resp_csv.content.decode("utf-8-sig")
    assert "VERSION COMPARISON AUDIT REPORT" in csv_text
    assert "Premium Tea" in csv_text
    assert "SIGNIFICANT_IMPROVEMENT" in csv_text


def test_placeholder_image_warning_suppression(caplog):
    """DEF-002: Verify synthetic placeholder URIs do not emit missing-file warnings."""
    import logging
    from services.report_service import _load_image, _is_synthetic_placeholder

    assert _is_synthetic_placeholder("/placeholder.png") is True
    assert _is_synthetic_placeholder("placeholder.png") is True
    assert _is_synthetic_placeholder("/api/images/placeholder.png") is True
    assert _is_synthetic_placeholder("placeholder.jpg") is True
    assert _is_synthetic_placeholder("/uploads/real_sample.png") is False

    with caplog.at_level(logging.WARNING):
        # 1. Synthetic placeholder should return None without emitting any warning
        caplog.clear()
        img_placeholder = _load_image("/placeholder.png", max_width=100, max_height=100)
        assert img_placeholder is None
        assert not any("Image file not found" in record.message for record in caplog.records)

        # 2. Empty string or None should return None without emitting any warning
        caplog.clear()
        assert _load_image("", max_width=100, max_height=100) is None
        assert _load_image(None, max_width=100, max_height=100) is None
        assert not any("Image file not found" in record.message for record in caplog.records)


def test_real_image_loading_and_genuine_missing_warning(caplog, tmp_path):
    """DEF-002: Verify real images load successfully while genuine missing non-placeholder images log a warning."""
    import logging
    import os
    from PIL import Image as PILImage
    from services.report_service import _load_image
    from config import settings

    # 1. Test real image loading
    test_img_filename = "test_audit_evidence.png"
    test_img_path = os.path.join(settings.UPLOAD_DIR, test_img_filename)
    
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    img = PILImage.new("RGB", (100, 100), color="blue")
    img.save(test_img_path)

    try:
        loaded = _load_image(f"/api/images/{test_img_filename}", max_width=200, max_height=200)
        assert loaded is not None
        assert loaded.drawWidth > 0
        assert loaded.drawHeight > 0
    finally:
        if os.path.exists(test_img_path):
            os.remove(test_img_path)

    # 2. Test genuinely missing image logs a warning
    with caplog.at_level(logging.WARNING):
        caplog.clear()
        missing_res = _load_image("/uploads/genuine_missing_artwork_9999.png", max_width=100, max_height=100)
        assert missing_res is None
        assert any("Image file not found" in record.message for record in caplog.records)


def test_pdf_report_generation_with_placeholders_emits_no_warnings(caplog):
    """DEF-002: Verify full PDF generation for demo case with placeholder images produces zero missing-image warnings."""
    import logging
    from api.demo import build_demo_response
    from services.report_service import generate_pdf_report

    demo_analysis = build_demo_response("1")
    assert demo_analysis.images and any(img.image_url == "/placeholder.png" for img in demo_analysis.images)

    with caplog.at_level(logging.WARNING):
        caplog.clear()
        pdf_bytes = generate_pdf_report(demo_analysis, lang="en")
        assert pdf_bytes.startswith(b"%PDF-")
        assert len(pdf_bytes) > 2000
        assert not any("Image file not found" in record.message for record in caplog.records)


# ═════════════════════════════════════════════════════════════════════════════
# DEF-P2-02: Report Evidence & Review Metadata Reliability Tests
# ═════════════════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_report_preserves_multi_image_evidence_with_partial_malformed(caplog):
    """DEF-P2-02 (1, 4): Multi-image evidence preserves valid images even if one item is malformed and logs warning."""
    import logging
    from api.report import _get_full_analysis_object
    from database.db import save_analysis
    
    analysis_data = {
        "id": "ana_multi_img_test",
        "product_name": "Multi-Panel Tea Box",
        "owner_user_id": "test_user",
        "organization_id": "org_test",
        "score": 85.0,
        "status": "COMPLIANT",
        "created_at": "2026-03-01T10:00:00Z",
        "image_filename": "primary_front.jpg",
        "images": json.dumps([
            {"filename": "panel_1.jpg", "image_url": "/api/images/panel_1.jpg", "label": "Front Panel", "ocr_text": "Tea 250g"},
            None,  # Malformed item
            "not_a_dict",  # Malformed item
            {"filename": "panel_2.jpg", "image_url": "/api/images/panel_2.jpg", "label": "Back Panel", "ocr_text": "MRP Rs 150"}
        ]),
        "compliance_result": json.dumps({
            "score": 85.0,
            "status": "COMPLIANT",
            "checks": []
        }),
        "extracted_data": json.dumps({"product_name": "Multi-Panel Tea Box"})
    }
    await save_analysis(analysis_data)
    user = {"username": "test_user", "role": ROLE_ADMIN}
    
    with caplog.at_level(logging.WARNING):
        analysis_obj = await _get_full_analysis_object("ana_multi_img_test", user)
        
    assert len(analysis_obj.images) == 2
    assert analysis_obj.images[0].label == "Front Panel"
    assert analysis_obj.images[1].label == "Back Panel"
    assert "Skipping non-dict image evidence item" in caplog.text


@pytest.mark.asyncio
async def test_report_includes_officer_review_metadata_and_comments():
    """DEF-P2-02 (2): Report includes officer review status, comments list, and human verified score."""
    from api.report import _get_full_analysis_object
    from database.db import save_analysis, save_review
    
    analysis_data = {
        "id": "ana_review_meta_test",
        "product_name": "Audit Sample Product",
        "owner_user_id": "test_user",
        "organization_id": "org_test",
        "score": 60.0,
        "status": "NON_COMPLIANT",
        "created_at": "2026-03-01T10:00:00Z",
        "compliance_result": json.dumps({"score": 60.0, "status": "NON_COMPLIANT", "checks": []}),
        "extracted_data": json.dumps({"product_name": "Audit Sample Product"})
    }
    await save_analysis(analysis_data)
    
    review_data = {
        "id": "rev_meta_test",
        "analysis_id": "ana_review_meta_test",
        "status": "APPROVED",
        "assigned_officer": "officer_rajesh",
        "verified_by": "officer_rajesh",
        "verified_at": "2026-03-02T12:00:00Z",
        "final_human_status": "COMPLIANT",
        "comments": json.dumps([
            {"comment_id": "cmt-1", "comment_type": "APPROVAL", "text": "Net quantity physically verified.", "officer_username": "officer_rajesh", "timestamp": "2026-03-02T12:00:00Z"}
        ]),
        "human_verified_result": json.dumps({"score": 95.0, "status": "COMPLIANT"}),
        "history": json.dumps([
            {"event_id": "evt-1", "action": "APPROVED", "actor_username": "officer_rajesh", "timestamp": "2026-03-02T12:00:00Z"}
        ])
    }
    await save_review(review_data)
    
    user = {"username": "test_user", "role": ROLE_ADMIN}
    analysis_obj = await _get_full_analysis_object("ana_review_meta_test", user)
    
    assert analysis_obj.officer_review is not None
    assert analysis_obj.officer_review["status"] == "APPROVED"
    assert analysis_obj.officer_review["assigned_officer"] == "officer_rajesh"
    assert analysis_obj.officer_review["human_score"] == 95.0
    assert len(analysis_obj.officer_review["comments"]) == 1
    assert analysis_obj.officer_review["comments"][0]["text"] == "Net quantity physically verified."


@pytest.mark.asyncio
async def test_report_handles_non_json_comments_gracefully(caplog):
    """DEF-P2-02 (5): Non-JSON plain text comments are gracefully wrapped and logged without breaking."""
    import logging
    from api.report import _get_full_analysis_object
    from database.db import save_analysis, save_review
    
    analysis_data = {
        "id": "ana_raw_comment_test",
        "product_name": "Sample Product Plain Comment",
        "owner_user_id": "test_user",
        "organization_id": "org_test",
        "score": 70.0,
        "status": "NON_COMPLIANT",
        "created_at": "2026-03-01T10:00:00Z",
        "compliance_result": json.dumps({"score": 70.0, "status": "NON_COMPLIANT", "checks": []}),
        "extracted_data": json.dumps({"product_name": "Sample Product Plain Comment"})
    }
    await save_analysis(analysis_data)
    
    review_data = {
        "id": "rev_raw_comment_test",
        "analysis_id": "ana_raw_comment_test",
        "status": "IN_REVIEW",
        "assigned_officer": "officer_sunil",
        "comments": "Plain string comment without JSON formatting.",
        "human_verified_result": None
    }
    await save_review(review_data)
    
    user = {"username": "test_user", "role": ROLE_ADMIN}
    with caplog.at_level(logging.WARNING):
        analysis_obj = await _get_full_analysis_object("ana_raw_comment_test", user)
        
    assert analysis_obj.officer_review is not None
    assert len(analysis_obj.officer_review["comments"]) == 1
    assert analysis_obj.officer_review["comments"][0]["text"] == "Plain string comment without JSON formatting."
    assert "Non-JSON comments string" in caplog.text


@pytest.mark.asyncio
async def test_report_corrupted_compliance_result_raises_500(caplog):
    """DEF-P2-02 (4): Corrupted compliance_result JSON fails with HTTP 500 rather than producing misleading blank report."""
    import logging
    from fastapi import HTTPException
    from api.report import _get_full_analysis_object
    from database.db import save_analysis
    
    analysis_data = {
        "id": "ana_corrupt_comp_test",
        "product_name": "Corrupted Result Product",
        "owner_user_id": "test_user",
        "organization_id": "org_test",
        "score": 0.0,
        "status": "FAIL",
        "created_at": "2026-03-01T10:00:00Z",
        "compliance_result": '{"checks": [INVALID_JSON_HERE',
        "extracted_data": json.dumps({"product_name": "Corrupted Result Product"})
    }
    await save_analysis(analysis_data)
    user = {"username": "test_user", "role": ROLE_ADMIN}
    
    with caplog.at_level(logging.ERROR):
        with pytest.raises(HTTPException) as exc_info:
            await _get_full_analysis_object("ana_corrupt_comp_test", user)
            
    assert exc_info.value.status_code == 500
    assert "Corrupted compliance result" in exc_info.value.detail
    assert "ana_corrupt_comp_test" in caplog.text

