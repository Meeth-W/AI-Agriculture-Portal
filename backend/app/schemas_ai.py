from pydantic import BaseModel, Field
from typing import List


class CropInsightsRequest(BaseModel):
    """Input payload for the AI insights endpoint."""
    crop_type: str = Field(..., examples=["Wheat"])
    nitrogen: float = Field(..., ge=0, examples=[80])
    phosphorus: float = Field(..., ge=0, examples=[50])
    potassium: float = Field(..., ge=0, examples=[60])
    temperature: float = Field(..., examples=[25.0])
    humidity: float = Field(..., ge=0, le=100, examples=[55.0])
    rainfall: float = Field(..., ge=0, examples=[120.0])
    ph_level: float = Field(..., ge=0, le=14, examples=[6.5])


class NutrientImpact(BaseModel):
    N: float
    P: float
    K: float


class WeatherImpact(BaseModel):
    temperature: float
    humidity: float
    rainfall: float


class GraphData(BaseModel):
    yield_trend: List[float]
    nutrient_impact: NutrientImpact
    weather_impact: WeatherImpact


class RiskAnalysis(BaseModel):
    level: str
    reasons: List[str]


class OptimalConditions(BaseModel):
    temperature: str
    humidity: str
    soil: str


class CropInsightsResponse(BaseModel):
    """Structured AI response payload."""
    yield_prediction: float
    confidence_score: float
    risk_analysis: RiskAnalysis
    recommendations: List[str]
    optimal_conditions: OptimalConditions
    graph_data: GraphData
