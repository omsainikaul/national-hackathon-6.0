import pytest
import logging
from unittest.mock import patch, MagicMock
from models.schemas import ProductInfo, ComplianceCheck, ProductImageEvidence
from compliance.engine import ComplianceEngine, engine
from compliance.rules.applicability import PackageContext
from compliance.rules.models import ComplianceStatus, RuleConflictItem


def test_01_normal_conflict_detection_preserved():
    """Verify standard conflict detection finds chronological, mathematical, and import conflicts."""
    eng = ComplianceEngine()
    
    # 1. Chronological conflict
    info_chrono = ProductInfo(
        product_name="Expired Batch Biscuit",
        manufacturing_date="10/2025",
        best_before="01/2024",
        mrp="Rs. 20.00",
        net_quantity="100 g"
    )
    res_chrono = eng.check(info_chrono)
    conflicts_chrono = [c for c in res_chrono["conflicts"] if c["conflict_type"] == "CHRONOLOGICAL_INCONSISTENCY"]
    assert len(conflicts_chrono) == 1
    assert "LM-008" in conflicts_chrono[0]["rule_ids"]
    assert "FS-005" in conflicts_chrono[0]["rule_ids"]
    assert conflicts_chrono[0]["severity"] == "HIGH"

    # 2. Mathematical mismatch (USP > MRP)
    info_usp = ProductInfo(
        product_name="Premium Basmati Rice",
        net_quantity="5 kg",
        mrp="Rs. 500.00",
        unit_sale_price="Rs. 600.00 / kg"
    )
    res_usp = eng.check(info_usp)
    conflicts_usp = [c for c in res_usp["conflicts"] if c["conflict_type"] == "MATHEMATICAL_MISMATCH"]
    assert len(conflicts_usp) == 1
    assert "LM-004" in conflicts_usp[0]["rule_ids"]
    assert "LM-007" in conflicts_usp[0]["rule_ids"]

    # 3. Import declaration mismatch
    info_import = ProductInfo(
        product_name="Imported Swiss Chocolate",
        country_of_origin="Switzerland",
        mrp="Rs. 350.00",
        net_quantity="100 g"
    )
    res_import = eng.check(info_import)
    conflicts_imp = [c for c in res_import["conflicts"] if c["conflict_type"] == "IMPORT_DECLARATION_MISMATCH"]
    assert len(conflicts_imp) == 1
    assert "LM-001" in conflicts_imp[0]["rule_ids"]
    assert "LM-006" in conflicts_imp[0]["rule_ids"]


def test_02_malformed_candidate_conflict_item_isolated(caplog):
    """Verify that an isolated malformed candidate conflict item logs diagnostically without discarding valid candidates."""
    eng = ComplianceEngine()
    
    class MalformedConflictItem:
        @property
        def field(self):
            raise RuntimeError("Corrupted conflict item descriptor")

    # Create a duck-typed product object supporting .conflicts attribute
    mock_info = MagicMock(spec=ProductInfo)
    mock_info.product_name = "Test Product with Conflicts"
    mock_info.manufacturing_date = None
    mock_info.manufacture_date = None
    mock_info.packaging_date = None
    mock_info.date_of_manufacture = None
    mock_info.best_before = None
    mock_info.expiry_date = None
    mock_info.use_by_date = None
    mock_info.mrp = None
    mock_info.unit_sale_price = None
    mock_info.country_of_origin = "India"
    mock_info.is_imported = False
    mock_info.importer_name = None
    mock_info.importer_address = None
    mock_info.conflicts = [
        {"field": "mrp", "conflict_type": "OCR_VALUE_DISCREPANCY", "description": "Reading Rs. 100 vs Rs. 150"},
        MalformedConflictItem(),
        {"field": "net_quantity", "conflict_type": "OCR_VALUE_DISCREPANCY", "description": "Reading 200g vs 250g"}
    ]

    context = PackageContext()

    with caplog.at_level(logging.ERROR, logger="compliance.engine"):
        conflicts = eng._detect_cross_rule_conflicts(mock_info, [], context)

    # The two valid candidate conflicts must be preserved
    candidate_conflicts = [c for c in conflicts if c.conflict_type == "OCR_VALUE_DISCREPANCY"]
    assert len(candidate_conflicts) == 2
    assert any("LM-004" in c.rule_ids for c in candidate_conflicts)
    assert any("LM-003" in c.rule_ids for c in candidate_conflicts)

    # Diagnostic error was logged for the malformed item
    assert any("Diagnostic error processing candidate conflict item" in record.message for record in caplog.records)


def test_03_unexpected_chronological_exception_logged_gracefully(caplog):
    """Verify that an unexpected error during chronological comparison is logged without crashing evaluation."""
    eng = ComplianceEngine()
    info = ProductInfo(
        product_name="Product with Date Check",
        manufacturing_date="10/2025",
        best_before="01/2026",
        mrp="Rs. 50.00",
        net_quantity="50 g"
    )

    orig_findall = __import__("re").findall
    def faulty_findall(pattern, string, *args, **kwargs):
        if "(?:20|19)\\d{2}" in pattern:
            raise TypeError("Simulated unhandled regex error in date matching")
        return orig_findall(pattern, string, *args, **kwargs)

    with patch("compliance.engine.re.findall", side_effect=faulty_findall):
        with caplog.at_level(logging.ERROR, logger="compliance.engine"):
            res = eng.check(info)

    assert "checks" in res
    assert "score" in res
    assert any("Diagnostic error in cross-rule chronological conflict evaluation" in record.message for record in caplog.records)


def test_04_unexpected_usp_mismatch_exception_logged_gracefully(caplog):
    """Verify that an unexpected error during USP comparison is logged without crashing evaluation."""
    eng = ComplianceEngine()
    info = ProductInfo(
        product_name="Product with USP Check",
        mrp="Rs. 100.00",
        unit_sale_price="Rs. 10.00 / g",
        net_quantity="10 g"
    )

    orig_findall = __import__("re").findall
    def faulty_findall(pattern, string, *args, **kwargs):
        if "\\d+(?:\\.\\d+)?" in pattern and ("unit_sale_price" in str(string) or string == "Rs. 10.00 / g"):
            raise TypeError("Simulated USP parse failure")
        return orig_findall(pattern, string, *args, **kwargs)

    with patch("compliance.engine.re.findall", side_effect=faulty_findall):
        with caplog.at_level(logging.ERROR, logger="compliance.engine"):
            res = eng.check(info)

    assert "checks" in res
    assert any("Diagnostic error in cross-rule USP vs MRP conflict evaluation" in record.message for record in caplog.records)


def test_05_unexpected_origin_exception_logged_gracefully(caplog):
    """Verify that an unexpected error during Origin comparison is logged without crashing evaluation."""
    eng = ComplianceEngine()
    
    mock_info = MagicMock(spec=ProductInfo)
    mock_info.product_name = "Mock Product"
    mock_info.manufacturing_date = None
    mock_info.manufacture_date = None
    mock_info.packaging_date = None
    mock_info.date_of_manufacture = None
    mock_info.best_before = None
    mock_info.expiry_date = None
    mock_info.use_by_date = None
    mock_info.mrp = None
    mock_info.unit_sale_price = None
    mock_info.conflicts = None
    mock_info.is_imported = False
    mock_info.importer_name = None
    mock_info.importer_address = None
    
    # country_of_origin evaluation raises an unexpected error
    type(mock_info).country_of_origin = property(lambda self: (_ for _ in ()).throw(ValueError("Simulated origin property failure")))
    
    context = PackageContext()

    with caplog.at_level(logging.ERROR, logger="compliance.engine"):
        conflicts = eng._detect_cross_rule_conflicts(mock_info, [], context)

    assert isinstance(conflicts, list)
    assert any("Diagnostic error in cross-rule origin vs importer conflict evaluation" in record.message for record in caplog.records)


def test_06_fatal_conflict_detector_failure_handled(caplog):
    """Verify that if the entire _detect_cross_rule_conflicts fails, it logs a fatal error and explicitly flags ANALYSIS_INCOMPLETE without falsely claiming COMPLIANT."""
    eng = ComplianceEngine()
    info = ProductInfo(
        product_name="Normal Product",
        mrp="Rs. 100.00",
        net_quantity="500 g",
        manufacturer="Standard Foods Ltd",
        country_of_origin="India",
        consumer_care="care@standardfoods.com"
    )

    with patch.object(eng, "_detect_cross_rule_conflicts", side_effect=RuntimeError("Simulated total detector crash")):
        with caplog.at_level(logging.ERROR, logger="compliance.engine"):
            res = eng.check(info)

    # Must NOT return an empty conflict list or falsely pretend analysis was complete
    assert len(res["conflicts"]) == 1
    assert res["conflicts"][0]["conflict_id"] == "CONF-EVAL-ERROR"
    assert res["conflicts"][0]["conflict_type"] == "ANALYSIS_INCOMPLETE"
    assert res["status"] != "COMPLIANT"
    assert res["status"] in ("REVIEW REQUIRED", "POTENTIAL NON-COMPLIANCE")
    assert any(issue.what == "Cross-rule conflict evaluation error" for issue in res["issues"])
    assert any("Fatal unexpected error in _detect_cross_rule_conflicts" in record.message for record in caplog.records)


def test_07_evaluate_alias_identical_to_check():
    """Verify that evaluate = check compatibility alias exists and returns identical results."""
    eng = ComplianceEngine()
    info = ProductInfo(
        product_name="Alias Verification Product",
        mrp="Rs. 250.00",
        net_quantity="1 kg",
        manufacturer="Standard Foods Ltd",
        country_of_origin="India",
        consumer_care="care@standardfoods.com"
    )

    res_check = eng.check(info)
    res_eval = eng.evaluate(info)

    assert res_check["score"] == res_eval["score"]
    assert res_check["status"] == res_eval["status"]
    assert len(res_check["checks"]) == len(res_eval["checks"])
    assert res_check["conflicts"] == res_eval["conflicts"]


def test_08_method_and_module_aliases():
    """Verify that detect_rule_conflicts and _detect_cross_rule_conflicts are aliases and callable."""
    eng = ComplianceEngine()
    assert eng.detect_rule_conflicts == eng._detect_cross_rule_conflicts
    assert hasattr(eng, "evaluate")
    assert eng.evaluate == eng.check
