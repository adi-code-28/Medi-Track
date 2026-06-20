import base64
import json
from pathlib import Path

from app.config import settings
from app.schemas import PrescriptionOCRResult

DEMO_PRESCRIPTION = PrescriptionOCRResult(
    medicines=[
        {
            "name": "Amlodipine",
            "dosage": "5mg",
            "frequency": "once daily in the morning",
            "duration_days": 30,
            "instructions": "Take after breakfast",
        },
        {
            "name": "Metformin",
            "dosage": "500mg",
            "frequency": "twice daily after meals",
            "duration_days": 30,
            "instructions": "Take with food",
        },
    ],
    doctor_name="Dr. Sharma",
    confidence="medium",
    raw_notes="Demo extraction — add GEMINI_API_KEY or OPENAI_API_KEY for live OCR",
)


def _encode_image(image_path: Path) -> str:
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


async def extract_prescription(image_path: Path) -> PrescriptionOCRResult:
    if settings.gemini_api_key:
        return await _extract_with_gemini(image_path)
    if settings.openai_api_key:
        return await _extract_with_openai(image_path)
    return DEMO_PRESCRIPTION


async def _extract_with_gemini(image_path: Path) -> PrescriptionOCRResult:
    import google.generativeai as genai

    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel("gemini-2.0-flash")

    image_data = image_path.read_bytes()
    prompt = """Extract prescription details from this image. Return ONLY valid JSON matching this schema:
{
  "medicines": [{"name": str, "dosage": str, "frequency": str, "duration_days": int|null, "instructions": str|null}],
  "doctor_name": str|null,
  "confidence": "high"|"medium"|"low",
  "raw_notes": str|null
}
If unreadable, return empty medicines array and confidence "low"."""

    response = model.generate_content(
        [
            prompt,
            {"mime_type": "image/jpeg", "data": image_data},
        ],
        generation_config={"response_mime_type": "application/json"},
    )
    data = json.loads(response.text)
    return PrescriptionOCRResult.model_validate(data)


async def _extract_with_openai(image_path: Path) -> PrescriptionOCRResult:
    from openai import OpenAI

    client = OpenAI(api_key=settings.openai_api_key)
    b64 = _encode_image(image_path)

    response = client.beta.chat.completions.parse(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Extract all medicines from this prescription image with dosage, frequency, and instructions.",
                    },
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{b64}"},
                    },
                ],
            }
        ],
        response_format=PrescriptionOCRResult,
    )
    parsed = response.choices[0].message.parsed
    if parsed is None:
        return DEMO_PRESCRIPTION
    return parsed
