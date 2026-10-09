import cv2
import numpy as np
import pytest
from vision.geometry import geometric_analyzer
from vision.package_detector import package_boundary_detector
from vision.panel_detector import panel_detector

def test_package_boundary_detection_rectangular():
    # White package box on dark background
    img = np.ones((800, 800, 3), dtype=np.uint8) * 30
    # Draw package rect from (150, 100) to (650, 700)
    cv2.rectangle(img, (150, 100), (650, 700), (220, 220, 220), -1)
    # Add some inner texture
    cv2.putText(img, "BRAND HEADER", (200, 200), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (20, 20, 20), 2)

    res = package_boundary_detector.detect(img)
    assert res.detected is True
    assert res.bbox is not None
    x1, y1, x2, y2 = res.bbox
    assert abs(x1 - 150) < 40
    assert abs(y1 - 100) < 40
    assert abs(x2 - 650) < 40
    assert abs(y2 - 700) < 40
    assert res.confidence > 0.60

def test_perspective_analyzer_on_trapezoid():
    # Create trapezoidal distorted package
    img = np.zeros((800, 800, 3), dtype=np.uint8)
    pts = np.array([[200, 150], [600, 120], [700, 680], [100, 700]], dtype=np.int32)
    cv2.fillPoly(img, [pts], (200, 200, 200))

    res, warped = geometric_analyzer.analyze_perspective(img)
    assert res.detected is True
    assert res.is_perspective_skewed is True
    assert res.quadrilateral is not None
    assert len(res.quadrilateral) == 4
    assert res.transform_matrix is not None
    assert warped is not None

def test_panel_classifier_front_vs_back():
    front_text = "ALPINO PEANUT BUTTER CRUNCHY 1KG HIGH PROTEIN DELICIOUS"
    front_words = [
        {"text": "ALPINO", "bbox": [100, 100, 400, 250], "confidence": 0.98},
        {"text": "PEANUT", "bbox": [100, 260, 350, 340], "confidence": 0.95},
        {"text": "BUTTER", "bbox": [100, 350, 350, 430], "confidence": 0.95},
    ]
    res_front = panel_detector.detect_and_classify(
        img_bgr=np.ones((600, 500, 3), dtype=np.uint8) * 200,
        ocr_text=front_text,
        words=front_words
    )
    assert res_front.primary_panel == "front_candidate"
    assert res_front.confidence > 0.50

    back_text = "INGREDIENTS: ROASTED PEANUTS. NUTRITION INFORMATION PER 100G: ENERGY 580KCAL, PROTEIN 30G. MANUFACTURED BY ALPINO HEALTH FOODS PVT LTD, SURAT GUJARAT. CONSUMER CARE HELPLINE 1800-123-456."
    back_words = [{"text": w, "bbox": [50, i*20, 400, i*20+18], "confidence": 0.92} for i, w in enumerate(back_text.split())]
    res_back = panel_detector.detect_and_classify(
        img_bgr=np.ones((800, 600, 3), dtype=np.uint8) * 200,
        ocr_text=back_text,
        words=back_words,
        has_nutrition_table=True
    )
    assert res_back.primary_panel == "back_candidate"
    assert res_back.confidence > 0.60


def test_hough_lines_unpacking_formats(monkeypatch):
    """Regression test for DEF-001: verifies 1D, 2D/nested, and malformed HoughLinesP arrays are safely handled."""
    from vision.quality import quality_gate

    # 1. Test 3D nested line array shape (N, 1, 4)
    lines_3d = np.array([[[250, 50, 255, 550]], [[252, 60, 256, 560]]], dtype=np.int32)
    monkeypatch.setattr(cv2, "HoughLinesP", lambda *args, **kwargs: lines_3d)
    
    img = np.ones((800, 600, 3), dtype=np.uint8) * 200
    res = panel_detector.detect_and_classify(
        img_bgr=img,
        ocr_text="ALPINO FRONT BRAND PANEL",
        words=[{"text": "ALPINO", "bbox": [50, 50, 200, 100], "confidence": 0.95}]
    )
    assert res.primary_panel is not None
    assert len(res.panels) >= 1

    # 2. Test 2D line array shape (N, 4) where iterating yields 1D line elements
    lines_2d = np.array([[250, 50, 255, 550], [252, 60, 256, 560]], dtype=np.int32)
    monkeypatch.setattr(cv2, "HoughLinesP", lambda *args, **kwargs: lines_2d)
    
    res_2d = panel_detector.detect_and_classify(
        img_bgr=img,
        ocr_text="ALPINO FRONT BRAND PANEL",
        words=[{"text": "ALPINO", "bbox": [50, 50, 200, 100], "confidence": 0.95}]
    )
    assert res_2d.primary_panel is not None
    assert len(res_2d.panels) >= 1

    # 3. Test malformed / incomplete line data (must skip safely without raising TypeError)
    lines_malformed = [np.array([250, 50]), np.array([1]), np.array([])]
    monkeypatch.setattr(cv2, "HoughLinesP", lambda *args, **kwargs: lines_malformed)
    
    res_malformed = panel_detector.detect_and_classify(
        img_bgr=img,
        ocr_text="ALPINO BRAND",
        words=[]
    )
    assert res_malformed.primary_panel is not None
    assert len(res_malformed.panels) == 1

    # 4. Test quality gate skew estimation with 2D line arrays
    skew_lines_2d = np.array([[10, 10, 200, 15], [20, 50, 300, 55]], dtype=np.int32)
    monkeypatch.setattr(cv2, "HoughLinesP", lambda *args, **kwargs: skew_lines_2d)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    angle, rot = quality_gate._estimate_skew_angle(gray)
    assert isinstance(angle, float)
    assert isinstance(rot, int)


def test_multi_facet_split_detection_with_vertical_seam(monkeypatch):
    """Verifies that a valid vertical seam line produces left and right panel facets."""
    # Vertical line at x=300 in a 600px wide image
    seam_lines = np.array([[300, 20, 300, 780]], dtype=np.int32)
    monkeypatch.setattr(cv2, "HoughLinesP", lambda *args, **kwargs: seam_lines)

    img = np.ones((800, 600, 3), dtype=np.uint8) * 220
    words = [
        {"text": "ALPINO BRAND", "bbox": [50, 100, 250, 200], "confidence": 0.98},
        {"text": "NUTRITION FACTS", "bbox": [350, 100, 550, 500], "confidence": 0.95}
    ]
    res = panel_detector.detect_and_classify(
        img_bgr=img,
        ocr_text="ALPINO BRAND NUTRITION FACTS",
        words=words
    )
    assert len(res.panels) == 3  # full panel + left facet + right facet
    panel_ids = [p.id for p in res.panels]
    assert "panel_primary" in panel_ids
    assert "facet_left" in panel_ids
    assert "facet_right" in panel_ids

