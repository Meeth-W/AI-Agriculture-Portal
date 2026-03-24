import json
import traceback
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from app.mongo import crop_collection, farms_collection
from app.core.config import settings
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

def get_current_user_email(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid auth credentials")
        return email
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid auth credentials")


class InsightsRequest(BaseModel):
    crop_type: Optional[str] = None
    region: Optional[str] = None
    season: Optional[str] = None
    focus_areas: Optional[List[str]] = None
    custom_prompt: Optional[str] = None


def build_prompt(user_crops: list, farm_info: dict, request: InsightsRequest) -> str:
    """Build a detailed prompt for Gemini that forces structured JSON output."""

    # Summarize the user's farm data for context
    crop_summary = []
    for c in user_crops:
        crop_summary.append({
            "crop_type": c.get("crop_type"),
            "nitrogen_n": c.get("nitrogen_n"),
            "phosphorus_p": c.get("phosphorus_p"),
            "potassium_k": c.get("potassium_k"),
            "temperature": c.get("temperature"),
            "humidity": c.get("humidity"),
            "ph_level": c.get("ph_level"),
            "rainfall": c.get("rainfall"),
            "plot_index": c.get("plot_index"),
            "is_active": c.get("is_active", True),
            "created_at": str(c.get("created_at", ""))
        })

    total_plots = farm_info.get("total_plots", 0) if farm_info else 0

    # Build context
    context_parts = [
        f"The farmer has a farm with {total_plots} total plots.",
        f"Currently active crop data: {json.dumps(crop_summary, indent=2)}" if crop_summary else "The farmer has no crop data recorded yet.",
    ]

    if request.crop_type:
        context_parts.append(f"The farmer is specifically interested in: {request.crop_type}")
    if request.region:
        context_parts.append(f"Farm region/location: {request.region}")
    if request.season:
        context_parts.append(f"Current season: {request.season}")
    if request.focus_areas:
        context_parts.append(f"Focus areas of interest: {', '.join(request.focus_areas)}")
    if request.custom_prompt:
        context_parts.append(f"Additional user request: {request.custom_prompt}")

    context = "\n".join(context_parts)

    prompt = f"""You are an expert agricultural data scientist and agronomist AI assistant. 
Analyze the following farm data and provide comprehensive, actionable insights.

=== FARM DATA ===
{context}
=== END FARM DATA ===

You MUST respond with ONLY valid JSON (no markdown, no code fences, no explanation outside JSON).
The JSON must follow this EXACT structure:

{{
  "summary": {{
    "title": "string - a compelling title for the overall farm analysis",
    "overview": "string - 2-3 sentence executive summary of farm health and key findings",
    "overall_score": number between 0-100 representing overall farm health,
    "key_metric_1_label": "string",
    "key_metric_1_value": "string with unit",
    "key_metric_2_label": "string",
    "key_metric_2_value": "string with unit",
    "key_metric_3_label": "string",
    "key_metric_3_value": "string with unit"
  }},
  "crop_health_scores": [
    {{
      "crop": "string - crop name",
      "overall_health": number 0-100,
      "soil_quality": number 0-100,
      "nutrient_balance": number 0-100,
      "water_efficiency": number 0-100,
      "growth_potential": number 0-100,
      "disease_resistance": number 0-100,
      "status": "string - Excellent/Good/Fair/Poor/Critical",
      "details": "string - brief explanation"
    }}
  ],
  "yield_forecast": [
    {{
      "month": "string - month name like Jan, Feb, etc.",
      "predicted_yield": number in kg,
      "optimal_yield": number in kg,
      "confidence": number 0-100
    }}
  ],
  "resource_optimization": [
    {{
      "resource": "string - resource name like Water, Nitrogen Fertilizer, etc.",
      "current_usage": number,
      "recommended_usage": number,
      "unit": "string - unit like L/day, kg/hectare, etc.",
      "savings_percent": number,
      "impact": "string - brief impact description"
    }}
  ],
  "risk_assessment": [
    {{
      "risk": "string - risk name",
      "category": "string - Weather/Pest/Disease/Soil/Market",
      "probability": "string - High/Medium/Low",
      "impact": "string - High/Medium/Low",
      "severity_score": number 1-10,
      "mitigation": "string - recommended action",
      "timeframe": "string - when this risk is most relevant"
    }}
  ],
  "soil_nutrient_analysis": [
    {{
      "nutrient": "string - nutrient name like Nitrogen, Phosphorus, etc.",
      "current_level": number,
      "ideal_min": number,
      "ideal_max": number,
      "unit": "string - unit like mg/kg, ppm, etc.",
      "status": "string - Deficient/Low/Optimal/Excess",
      "recommendation": "string - what to do"
    }}
  ],
  "seasonal_timeline": [
    {{
      "week": "string like Week 1, Week 2, etc. (provide 8-12 weeks)",
      "activity": "string - primary farming activity",
      "priority": "string - Critical/High/Medium/Low",
      "details": "string - brief description of what to do"
    }}
  ],
  "recommendations": [
    {{
      "title": "string - recommendation title",
      "description": "string - detailed actionable recommendation (2-3 sentences)",
      "priority": "string - Critical/High/Medium/Low",
      "category": "string - Soil/Water/Crop/Pest/Harvest/General",
      "expected_impact": "string - what improvement to expect"
    }}
  ]
}}

IMPORTANT RULES:
1. Provide EXACTLY valid JSON. No markdown formatting, no code blocks, no text before or after the JSON.
2. crop_health_scores: provide data for each active crop the farmer has. If no crops, generate for 3-4 common crops.
3. yield_forecast: provide 12 months of data (Jan through Dec).
4. resource_optimization: provide at least 5 resources.
5. risk_assessment: provide at least 5 risks across different categories.
6. soil_nutrient_analysis: provide at least 6 nutrients.
7. seasonal_timeline: provide 8-12 weeks of planned activities.
8. recommendations: provide at least 6 actionable recommendations.
9. All numbers should be realistic and based on the provided farm data.
10. If no farm data is available, use reasonable defaults for a generic mixed-crop farm.
"""

    return prompt


from datetime import datetime
from app.mongo import crop_collection, farms_collection, insights_collection

# ... existing code (base prompts etc.) remains the same ...

@router.get("/")
async def get_stored_insights(
    current_user_email: str = Depends(get_current_user_email)
):
    """Fetch the latest stored insights for the current user."""
    stored = insights_collection.find_one({"user_email": current_user_email})
    if not stored:
        return {"status": "not_found", "insights": None}
    
    # Remove MongoDB internal IDs
    stored.pop("_id", None)
    return {
        "status": "success",
        "insights": stored.get("insights"),
        "last_updated": stored.get("updated_at")
    }


@router.post("/")
async def generate_insights(
    request: InsightsRequest,
    current_user_email: str = Depends(get_current_user_email)
):
    """Generate and store/update AI-powered agricultural insights."""
    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "your-gemini-api-key-here":
        raise HTTPException(
            status_code=503,
            detail="Gemini API key is not configured. Please set GEMINI_API_KEY in the .env file."
        )

    # Fetch user's crop data from MongoDB for context
    crops_cursor = crop_collection.find({"user_email": current_user_email})
    user_crops = []
    for doc in crops_cursor:
        doc["_id"] = str(doc["_id"])
        user_crops.append(doc)

    # Fetch farm info
    farm_info = farms_collection.find_one({"user_email": current_user_email})

    # Build prompt
    prompt = build_prompt(user_crops, farm_info, request)

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=settings.GEMINI_API_KEY)

        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.7,
                max_output_tokens=8192,
            )
        )

        # Extract text from response
        response_text = response.text.strip()

        # Clean up response - remove markdown code fences if present
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        elif response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()

        # Parse JSON
        try:
            insights_data = json.loads(response_text)
        except json.JSONDecodeError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to parse AI response as JSON: {str(e)}"
            )

        # Store in MongoDB (Upsert: one entry per user)
        insights_collection.update_one(
            {"user_email": current_user_email},
            {
                "$set": {
                    "insights": insights_data,
                    "updated_at": datetime.utcnow()
                }
            },
            upsert=True
        )

        return {
            "status": "success",
            "insights": insights_data
        }

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate insights: {str(e)}"
        )
