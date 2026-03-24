import json
import re
import logging
from typing import Any

import google.generativeai as genai

from app.core.config import settings

logger = logging.getLogger(__name__)

# ── Gemini client setup ──────────────────────────────────────────────────────

def _get_model() -> genai.GenerativeModel:
    """Configure and return a Gemini GenerativeModel instance."""
    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "your_api_key_here":
        raise RuntimeError(
            "GEMINI_API_KEY is not configured. "
            "Set a valid key in your .env file."
        )
    genai.configure(api_key=settings.GEMINI_API_KEY)
    return genai.GenerativeModel(settings.GEMINI_MODEL)


# ── Prompt builder ───────────────────────────────────────────────────────────

def _build_prompt(
    crop_type: str,
    nitrogen: float,
    phosphorus: float,
    potassium: float,
    temperature: float,
    humidity: float,
    rainfall: float,
    ph_level: float,
) -> str:
    return f"""
You are an advanced agricultural intelligence system trained in agronomy, crop science, and predictive analytics.

Your task is to analyze structured farm data and return ONLY valid JSON.

STRICT RULES:
- Do NOT return explanations
- Do NOT include text outside JSON
- Ensure output is machine-parseable

INPUT DATA:
Crop: {crop_type}
Temperature: {temperature} °C
Humidity: {humidity} %
Rainfall: {rainfall} mm
Soil:
  Nitrogen: {nitrogen}
  Phosphorus: {phosphorus}
  Potassium: {potassium}
pH: {ph_level}

TASKS:

1. Predict realistic yield (kg)
2. Analyze risk level (low/medium/high) with reasons
3. Generate actionable recommendations (specific, not generic)
4. Define optimal conditions for this crop
5. Generate data for frontend visualizations

OUTPUT FORMAT:

{{
  "yield_prediction": number,
  "confidence_score": number (0-100),

  "risk_analysis": {{
    "level": "low | medium | high",
    "reasons": ["..."]
  }},

  "recommendations": [
    "specific actionable advice"
  ],

  "optimal_conditions": {{
    "temperature": "range",
    "humidity": "range",
    "soil": "nutrient insights"
  }},

  "graph_data": {{
    "yield_trend": [6 realistic values],
    "nutrient_impact": {{
      "N": number,
      "P": number,
      "K": number
    }},
    "weather_impact": {{
      "temperature": number,
      "humidity": number,
      "rainfall": number
    }}
  }}
}}
"""


# ── Response parser ──────────────────────────────────────────────────────────

def _extract_json(raw_text: str) -> dict[str, Any]:
    """
    Robustly extract JSON from Gemini's response.
    Handles cases where the model wraps output in markdown code fences.
    """
    text = raw_text.strip()

    # Strip markdown code fences if present
    fence_match = re.search(r"```(?:json)?\s*\n?(.*?)\n?\s*```", text, re.DOTALL)
    if fence_match:
        text = fence_match.group(1).strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        logger.error("Failed to parse Gemini response as JSON: %s", exc)
        logger.debug("Raw response: %s", raw_text[:500])
        raise ValueError(
            "The AI returned an invalid response. Please try again."
        ) from exc


# ── Public API ───────────────────────────────────────────────────────────────

async def generate_crop_insights(
    crop_type: str,
    nitrogen: float,
    phosphorus: float,
    potassium: float,
    temperature: float,
    humidity: float,
    rainfall: float,
    ph_level: float,
) -> dict[str, Any]:
    """
    Call Gemini with structured crop data and return parsed JSON insights.
    Raises RuntimeError if API key is missing, ValueError on bad JSON.
    """
    model = _get_model()
    prompt = _build_prompt(
        crop_type, nitrogen, phosphorus, potassium,
        temperature, humidity, rainfall, ph_level,
    )

    try:
        response = model.generate_content(prompt)
    except Exception as exc:
        logger.error("Gemini API call failed: %s", exc)
        raise RuntimeError(
            "Failed to get a response from the AI service."
        ) from exc

    if not response.text:
        raise ValueError("The AI returned an empty response.")

    return _extract_json(response.text)
