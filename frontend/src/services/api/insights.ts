import { API_URL, getToken } from './auth';

export interface InsightsRequest {
  crop_type?: string;
  region?: string;
  season?: string;
  focus_areas?: string[];
  custom_prompt?: string;
}

export interface InsightsSummary {
  title: string;
  overview: string;
  overall_score: number;
  key_metric_1_label: string;
  key_metric_1_value: string;
  key_metric_2_label: string;
  key_metric_2_value: string;
  key_metric_3_label: string;
  key_metric_3_value: string;
}

export interface CropHealthScore {
  crop: string;
  overall_health: number;
  soil_quality: number;
  nutrient_balance: number;
  water_efficiency: number;
  growth_potential: number;
  disease_resistance: number;
  status: string;
  details: string;
}

export interface YieldForecast {
  month: string;
  predicted_yield: number;
  optimal_yield: number;
  confidence: number;
}

export interface ResourceOptimization {
  resource: string;
  current_usage: number;
  recommended_usage: number;
  unit: string;
  savings_percent: number;
  impact: string;
}

export interface RiskAssessment {
  risk: string;
  category: string;
  probability: string;
  impact: string;
  severity_score: number;
  mitigation: string;
  timeframe: string;
}

export interface SoilNutrient {
  nutrient: string;
  current_level: number;
  ideal_min: number;
  ideal_max: number;
  unit: string;
  status: string;
  recommendation: string;
}

export interface SeasonalTimeline {
  week: string;
  activity: string;
  priority: string;
  details: string;
}

export interface Recommendation {
  title: string;
  description: string;
  priority: string;
  category: string;
  expected_impact: string;
}

export interface InsightsData {
  summary: InsightsSummary;
  crop_health_scores: CropHealthScore[];
  yield_forecast: YieldForecast[];
  resource_optimization: ResourceOptimization[];
  risk_assessment: RiskAssessment[];
  soil_nutrient_analysis: SoilNutrient[];
  seasonal_timeline: SeasonalTimeline[];
  recommendations: Recommendation[];
}

export interface InsightsResponse {
  status: string;
  insights: InsightsData;
  last_updated?: string;
}

export const getStoredInsights = async (): Promise<InsightsResponse> => {
  const token = getToken();
  if (!token) throw new Error('No authentication token found');

  const response = await fetch(`${API_URL}/insights/`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to fetch stored insights');
  }

  return await response.json();
};

export const fetchInsights = async (request: InsightsRequest): Promise<InsightsResponse> => {
  const token = getToken();
  if (!token) throw new Error('No authentication token found');

  const response = await fetch(`${API_URL}/insights/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to fetch insights');
  }

  return await response.json();
};
