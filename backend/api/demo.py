import os
import mimetypes
from typing import List, Dict, Any

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from demo.cases import DEMO_CASES, get_demo_cases_list
from models.schemas import (
    AnalysisResponse,
    OCRResult,
    OCRWord,
    ComplianceResult,
    ProductImageEvidence,
)
from compliance.engine import engine
from compliance.rules.legal_metrology import compute_font_size_and_readability

router = APIRouter()

BENCHMARK_FIXTURE_TIMESTAMP = "2026-09-01T00:00:00Z"


def build_demo_response(case_id: str) -> AnalysisResponse:
    """Build in-memory demo AnalysisResponse from static benchmark fixtures without database writes."""
    clean_id = str(case_id).strip().lower()
    if clean_id.startswith("demo-"):
        parts = clean_id.split("-")
        if len(parts) >= 2 and parts[1] in DEMO_CASES:
            clean_id = parts[1]
        elif clean_id in ("demo-1", "demo-2", "demo-3"):
            clean_id = clean_id.replace("demo-", "")
    
    if clean_id not in DEMO_CASES:
        raise HTTPException(status_code=404, detail=f"Demo case '{case_id}' not found. Available cases: 1, 2, or 3.")
        
    product_info = DEMO_CASES[clean_id]
    
    # Run deterministic compliance check using existing engine
    comp_result_dict = engine.check(product_info)
    compliance_result = ComplianceResult(**comp_result_dict)
    
    stable_id = f"demo-{clean_id}"
    
    # Build synthetic multi-panel OCR results representing the package
    front_text = f"BRAND: {product_info.brand or 'N/A'}\nPRODUCT: {product_info.product_name or 'N/A'}\nNET QTY: {product_info.net_quantity or 'N/A'}"
    back_text = (
        f"MANUFACTURED BY: {product_info.manufacturer or 'N/A'}\n"
        f"MRP: {product_info.mrp or 'N/A'} (INCL. OF ALL TAXES)\n"
        f"MFG DATE: {product_info.manufacturing_date or 'N/A'}\n"
        f"EXPIRY: {product_info.expiry_date or 'N/A'}\n"
        f"BATCH NO: {product_info.batch_number or 'N/A'}\n"
        f"FSSAI LIC NO: {product_info.fssai_license or 'N/A'}\n"
        f"CONSUMER CARE: {product_info.consumer_care or 'N/A'}\n"
        f"INGREDIENTS: {product_info.ingredients or 'N/A'}\n"
        f"COUNTRY OF ORIGIN: {product_info.country_of_origin or 'N/A'}"
    )
    full_ocr_text = f"{front_text}\n\n{back_text}"
    
    ocr_result = OCRResult(
        full_text=full_ocr_text,
        words=[
            OCRWord(text=w, confidence=98.5, bbox=[10, 10, 50, 20])
            for w in full_ocr_text.split()[:20]
        ],
        language="eng",
        processing_time=0.05,
        average_confidence=98.0,
        word_count=len(full_ocr_text.split()),
        engine="PaddleOCR (Demo Fixture)",
        preprocessing_variant="Standard Demo Preset"
    )
    
    images = [
        ProductImageEvidence(
            filename="placeholder.png",
            image_url="/placeholder.png",
            label="Front",
            ocr_text=front_text,
            word_count=len(front_text.split()),
            average_confidence=98.5,
            preprocessing_variant="Demo Front Preset"
        ),
        ProductImageEvidence(
            filename="placeholder.png",
            image_url="/placeholder.png",
            label="Back",
            ocr_text=back_text,
            word_count=len(back_text.split()),
            average_confidence=97.5,
            preprocessing_variant="Demo Back Preset"
        )
    ]
    font_size_analysis = compute_font_size_and_readability(
        product_info=product_info,
        ocr_result=ocr_result,
        images=images,
        checks=compliance_result.checks
    )

    
    return AnalysisResponse(
        id=stable_id,
        product_name=product_info.product_name or 'Unknown Product',
        image_url="/placeholder.png",
        images=images,
        ocr_result=ocr_result,
        product_info=product_info,
        compliance_result=compliance_result,
        recommendations=compliance_result.recommendations,
        created_at=BENCHMARK_FIXTURE_TIMESTAMP,
        font_size_analysis=font_size_analysis
    )


FIXTURES_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "fixtures"))

VERIFIED_SAMPLE_WHITELIST = {
    "alpino_front.png",
    "alpino_back.png",
    "takatak_front.jpeg",
    "takatak_back.jpeg",
    "lays_front.jpeg",
    "lays_back.jpeg"
}

DEMO_LIVE_SAMPLES = [
    {
        "id": "alpino_oats",
        "name": "Alpino Super Oats (400g)",
        "badge": "COMPLIANT",
        "category": "Breakfast Cereals",
        "compliance_summary": "No statutory issues detected across Rules 6, 7, 8, 9, 10, 12",
        "description": "Genuine consumer packaged food product with all mandatory declarations present: 400g Net Qty, MRP ₹199, FSSAI Lic 10716022000249, Veg symbol, and manufacturer address.",
        "panels": [
            {"slot": "front", "label": "Front", "filename": "alpino_front.png", "url": "/api/demo/sample-image/alpino_front.png", "local_path": "/demo-samples/alpino_front.png"},
            {"slot": "back", "label": "Back", "filename": "alpino_back.png", "url": "/api/demo/sample-image/alpino_back.png", "local_path": "/demo-samples/alpino_back.png"}
        ]
    },
    {
        "id": "takatak_snacks",
        "name": "Tak-a-Tak / Kurkure Snacks",
        "badge": "DEFICIENT",
        "category": "Packaged Snack",
        "compliance_summary": "Action Required: Missing clear best-before date & dual/smudged ink-jet MRP",
        "description": "Real snack package demonstrating common retail packaging non-compliance: dual printed MRP stamps and faint/absent statutory expiry dates under Rule 6(1)(d).",
        "panels": [
            {"slot": "front", "label": "Front", "filename": "takatak_front.jpeg", "url": "/api/demo/sample-image/takatak_front.jpeg", "local_path": "/demo-samples/takatak_front.jpeg"},
            {"slot": "back", "label": "Back", "filename": "takatak_back.jpeg", "url": "/api/demo/sample-image/takatak_back.jpeg", "local_path": "/demo-samples/takatak_back.jpeg"}
        ]
    }
]


@router.get("/demo/samples", response_model=List[Dict[str, Any]])
async def list_demo_samples():
    """Return catalog of verified real packaging demo samples for one-click live analysis loading."""
    return DEMO_LIVE_SAMPLES


@router.get("/demo/sample-image/{filename}")
async def get_demo_sample_image(filename: str):
    """Securely serve verified demo fixture images for live analysis without requiring login."""
    if not filename or filename not in VERIFIED_SAMPLE_WHITELIST:
        raise HTTPException(status_code=404, detail="Demo sample image not found in verified whitelist.")
    
    file_path = os.path.abspath(os.path.join(FIXTURES_DIR, filename))
    if not file_path.startswith(FIXTURES_DIR) or not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="Demo sample fixture image file not found.")
    
    mime_type, _ = mimetypes.guess_type(file_path)
    return FileResponse(file_path, media_type=mime_type or "image/png")


@router.get("/demo/cases", response_model=List[Dict[str, Any]])
async def list_demo_cases():
    """Return catalog of prepared demonstration packaged commodity cases for SIH presentation."""
    return get_demo_cases_list()


@router.get("/demo/{case_id}", response_model=AnalysisResponse)
async def get_demo_case(case_id: str):
    """Load a prepared demonstration analysis case without running expensive live OCR or database writes."""
    return build_demo_response(case_id)

