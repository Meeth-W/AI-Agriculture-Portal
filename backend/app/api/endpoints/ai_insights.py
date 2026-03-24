import logging
from fastapi import APIRouter, Depends, HTTPException

from app.schemas_ai import CropInsightsRequest, CropInsightsResponse
from app.core.gemini_service import generate_crop_insights
from app.api.endpoints.users import get_current_user_email

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/insights", response_model=CropInsightsResponse)
async def get_ai_insights(
    payload: CropInsightsRequest,
    current_user_email: str = Depends(get_current_user_email),
):
    """
    Generate AI-powered crop insights using Gemini.
    Requires authentication.
    """
    try:
        result = await generate_crop_insights(
            crop_type=payload.crop_type,
            nitrogen=payload.nitrogen,
            phosphorus=payload.phosphorus,
            potassium=payload.potassium,
            temperature=payload.temperature,
            humidity=payload.humidity,
            rainfall=payload.rainfall,
            ph_level=payload.ph_level,
        )
        # Validate the AI output against our response schema
        return CropInsightsResponse(**result)

    except RuntimeError as exc:
        logger.error("AI service error: %s", exc)
        raise HTTPException(status_code=503, detail=str(exc))

    except ValueError as exc:
        logger.error("AI response parsing error: %s", exc)
        raise HTTPException(status_code=502, detail=str(exc))

    except Exception as exc:
        logger.error("Unexpected error in AI insights: %s", exc)
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while generating insights.",
        )
