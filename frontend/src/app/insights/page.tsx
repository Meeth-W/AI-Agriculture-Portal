"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "../../services/api/auth";
import {
  fetchInsights,
  getStoredInsights,
  InsightsRequest,
  InsightsData,
} from "../../services/api/insights";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  Legend,
  Cell,
} from "recharts";

// --- Color palette ---
const COLORS = {
  olive600: "#6b8655",
  olive500: "#88a372",
  olive400: "#a7be95",
  olive300: "#c6d6ba",
  olive200: "#dce7d4",
  olive100: "#eef3ea",
  olive50: "#f7f9f6",
  olive900: "#3a4731",
  olive800: "#465639",
  olive700: "#556a44",
  blue: "#3b82f6",
  amber: "#f59e0b",
  red: "#ef4444",
  emerald: "#10b981",
  purple: "#8b5cf6",
  cyan: "#06b6d4",
  pink: "#ec4899",
};

const CHART_COLORS = [
  COLORS.olive600,
  COLORS.blue,
  COLORS.amber,
  COLORS.emerald,
  COLORS.purple,
  COLORS.cyan,
];

const PRIORITY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  Critical: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  High: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  Medium: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  Low: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
};

const STATUS_STYLES: Record<string, string> = {
  Excellent: "text-emerald-600 bg-emerald-50 border-emerald-200",
  Good: "text-green-600 bg-green-50 border-green-200",
  Fair: "text-amber-600 bg-amber-50 border-amber-200",
  Poor: "text-orange-600 bg-orange-50 border-orange-200",
  Critical: "text-red-600 bg-red-50 border-red-200",
  Optimal: "text-emerald-600 bg-emerald-50 border-emerald-200",
  Low: "text-amber-600 bg-amber-50 border-amber-200",
  Deficient: "text-red-600 bg-red-50 border-red-200",
  Excess: "text-purple-600 bg-purple-50 border-purple-200",
};

const CROP_OPTIONS = ["Wheat", "Corn", "Rice", "Soybeans", "Potatoes", "Cotton"];
const SEASON_OPTIONS = ["Spring", "Summer", "Monsoon", "Autumn", "Winter"];
const FOCUS_OPTIONS = [
  { id: "yield_optimization", label: "Yield Optimization" },
  { id: "pest_management", label: "Pest Management" },
  { id: "soil_health", label: "Soil Health" },
  { id: "water_management", label: "Water Management" },
  { id: "crop_rotation", label: "Crop Rotation" },
  { id: "sustainability", label: "Sustainability" },
];

export default function InsightsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);

  // Form state
  const [cropType, setCropType] = useState("");
  const [region, setRegion] = useState("");
  const [season, setSeason] = useState("");
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [customPrompt, setCustomPrompt] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    const loadInitialInsights = async () => {
      try {
        const response = await getStoredInsights();
        if (response.status === "success" && response.insights) {
          setInsights(response.insights);
          if (response.last_updated) {
            setLastUpdated(new Date(response.last_updated).toLocaleString());
          }
        }
      } catch (err: any) {
        console.error("Failed to load historical insights:", err);
      } finally {
        setInitialLoading(false);
      }
    };

    loadInitialInsights();
  }, [router]);

  const toggleFocus = (id: string) => {
    setFocusAreas((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    const request: InsightsRequest = {};
    if (cropType) request.crop_type = cropType;
    if (region) request.region = region;
    if (season) request.season = season;
    if (focusAreas.length > 0) request.focus_areas = focusAreas;
    if (customPrompt) request.custom_prompt = customPrompt;

    try {
      const response = await fetchInsights(request);
      setInsights(response.insights);
      setLastUpdated(new Date().toLocaleString());
    } catch (err: any) {
      setError(err.message || "Failed to generate insights");
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return COLORS.emerald;
    if (score >= 60) return COLORS.olive600;
    if (score >= 40) return COLORS.amber;
    return COLORS.red;
  };

  return (
    <div className="min-h-screen bg-olive-50">
      <div className="container mx-auto px-4 py-8 md:px-6 max-w-7xl">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-olive-600 to-olive-400 flex items-center justify-center shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v4" /><path d="m6.343 6.343 2.828 2.829" /><path d="M2 12h4" />
                <path d="m6.343 17.657 2.828-2.829" /><path d="M12 18v4" />
                <path d="m17.657 17.657-2.829-2.829" /><path d="M18 12h4" />
                <path d="m17.657 6.343-2.829 2.829" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-olive-900 tracking-tight">AI Insights</h1>
              <p className="text-olive-600 text-sm">Powered by Google Gemini — analyze your farm with AI</p>
            </div>
          </div>
        </div>

        {/* Input Controls */}
        <div className="bg-white rounded-2xl border border-olive-100 shadow-sm mb-8 overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-olive-900">Generate Farm Insights</h2>
                <p className="text-olive-600 text-sm mt-0.5">
                  Click generate for automatic analysis, or customize the options below.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowOptions(!showOptions)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-olive-200 text-olive-700 text-sm font-medium hover:bg-olive-50 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  {showOptions ? "Hide Options" : "Customize"}
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="flex items-center gap-2 bg-gradient-to-r from-olive-600 to-olive-500 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2v4" /><path d="m6.343 6.343 2.828 2.829" /><path d="M2 12h4" />
                        <path d="m17.657 6.343-2.829 2.829" /><path d="M18 12h4" />
                        <path d="m17.657 17.657-2.829-2.829" /><path d="M12 18v4" />
                        <path d="m6.343 17.657 2.828-2.829" />
                      </svg>
                      Generate Insights
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Expandable Options */}
            {showOptions && (
              <div className="mt-6 pt-6 border-t border-olive-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-300">
                <div>
                  <label className="block text-sm font-semibold text-olive-800 mb-1.5">Crop Type</label>
                  <select
                    value={cropType}
                    onChange={(e) => setCropType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-olive-200 bg-white text-olive-900 text-sm focus:ring-2 focus:ring-olive-500 focus:border-olive-500 outline-none transition-all"
                  >
                    <option value="">All Crops</option>
                    {CROP_OPTIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-olive-800 mb-1.5">Region</label>
                  <input
                    type="text"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="e.g., Punjab, India"
                    className="w-full px-3 py-2.5 rounded-xl border border-olive-200 bg-white text-olive-900 text-sm focus:ring-2 focus:ring-olive-500 focus:border-olive-500 outline-none transition-all placeholder:text-olive-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-olive-800 mb-1.5">Season</label>
                  <select
                    value={season}
                    onChange={(e) => setSeason(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-olive-200 bg-white text-olive-900 text-sm focus:ring-2 focus:ring-olive-500 focus:border-olive-500 outline-none transition-all"
                  >
                    <option value="">Auto-detect</option>
                    {SEASON_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-olive-800 mb-1.5">Custom Request</label>
                  <input
                    type="text"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Any specific analysis..."
                    className="w-full px-3 py-2.5 rounded-xl border border-olive-200 bg-white text-olive-900 text-sm focus:ring-2 focus:ring-olive-500 focus:border-olive-500 outline-none transition-all placeholder:text-olive-400"
                  />
                </div>
                <div className="md:col-span-2 lg:col-span-4">
                  <label className="block text-sm font-semibold text-olive-800 mb-2">Focus Areas</label>
                  <div className="flex flex-wrap gap-2">
                    {FOCUS_OPTIONS.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => toggleFocus(f.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                          focusAreas.includes(f.id)
                            ? "bg-olive-600 text-white border-olive-600 shadow-sm"
                            : "bg-white text-olive-700 border-olive-200 hover:border-olive-400"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Initial Loading State */}
        {initialLoading && (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-12 h-12 rounded-full border-4 border-olive-200 border-t-olive-600 animate-spin mb-4" />
            <p className="text-olive-600 font-medium">Loading historical insights...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-8 flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-red-800 font-semibold text-sm">Error generating insights</p>
              <p className="text-red-600 text-sm mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-olive-100 p-8 flex flex-col items-center justify-center min-h-[300px]">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-olive-200 border-t-olive-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full border-4 border-olive-100 border-b-olive-500 animate-spin" style={{ animationDirection: "reverse", animationDuration: "0.6s" }} />
                </div>
              </div>
              <p className="text-olive-700 font-semibold mt-6 text-lg">Analyzing your farm data...</p>
              <p className="text-olive-500 text-sm mt-1">Gemini AI is processing your request. This may take a moment.</p>
              <div className="flex gap-1.5 mt-4">
                <div className="w-2 h-2 rounded-full bg-olive-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 rounded-full bg-olive-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 rounded-full bg-olive-600 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !initialLoading && !insights && !error && (
          <div className="bg-white rounded-2xl border border-olive-100 p-12 flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-olive-100 to-olive-200 flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#6b8655" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v4" /><path d="m6.343 6.343 2.828 2.829" /><path d="M2 12h4" />
                <path d="m6.343 17.657 2.828-2.829" /><path d="M12 18v4" />
                <path d="m17.657 17.657-2.829-2.829" /><path d="M18 12h4" />
                <path d="m17.657 6.343-2.829 2.829" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-olive-900 mb-2">Ready to Analyze</h3>
            <p className="text-olive-600 text-center max-w-md mb-6">
              Click &quot;Generate Insights&quot; to get AI-powered analysis of your farm data including yield forecasts, soil health, and actionable recommendations.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {["📊 Yield Forecast", "🌱 Crop Health", "💧 Resource Usage", "⚠️ Risk Analysis", "🧪 Soil Nutrients"].map((t) => (
                <span key={t} className="text-xs px-3 py-1.5 rounded-full bg-olive-50 text-olive-600 border border-olive-100 font-medium">{t}</span>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {insights && !loading && (
          <div className="space-y-8 pb-12">

            {/* Summary Hero */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-olive-800 via-olive-700 to-olive-900 text-white p-8 shadow-xl">
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-olive-600/20 blur-3xl -mr-20 -mt-20" />
              <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-olive-500/20 blur-3xl -ml-10 -mb-10" />
              <div className="relative z-10">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        AI Analysis Complete
                      </div>
                      {lastUpdated && (
                        <div className="text-olive-300 text-xs font-medium">
                          Last updated: {lastUpdated}
                        </div>
                      )}
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold mb-3">{insights.summary.title}</h2>
                    <p className="text-olive-200 text-base leading-relaxed max-w-2xl">{insights.summary.overview}</p>
                  </div>
                  <div className="flex-shrink-0 flex items-center justify-center">
                    <div className="relative w-32 h-32">
                      <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
                        <circle
                          cx="60" cy="60" r="52" fill="none"
                          stroke={getScoreColor(insights.summary.overall_score)}
                          strokeWidth="10" strokeLinecap="round"
                          strokeDasharray={`${(insights.summary.overall_score / 100) * 327} 327`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold">{insights.summary.overall_score}</span>
                        <span className="text-xs text-olive-300">Health Score</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                  {[
                    { label: insights.summary.key_metric_1_label, value: insights.summary.key_metric_1_value },
                    { label: insights.summary.key_metric_2_label, value: insights.summary.key_metric_2_value },
                    { label: insights.summary.key_metric_3_label, value: insights.summary.key_metric_3_value },
                  ].map((m, i) => (
                    <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/5">
                      <p className="text-olive-300 text-xs font-medium uppercase tracking-wider">{m.label}</p>
                      <p className="text-xl font-bold mt-1">{m.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Charts Row 1: Crop Health + Yield Forecast */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Crop Health Radar */}
              {insights.crop_health_scores && insights.crop_health_scores.length > 0 && (
                <div className="bg-white rounded-2xl border border-olive-100 shadow-sm p-6">
                  <h3 className="text-lg font-bold text-olive-900 mb-1 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-olive-500" />
                    Crop Health Analysis
                  </h3>
                  <p className="text-olive-500 text-sm mb-6">Multi-dimensional health scoring per crop</p>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={(() => {
                        const metrics = ["soil_quality", "nutrient_balance", "water_efficiency", "growth_potential", "disease_resistance"];
                        return metrics.map(m => {
                          const entry: any = { metric: m.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()) };
                          insights.crop_health_scores.forEach(c => {
                            entry[c.crop] = (c as any)[m];
                          });
                          return entry;
                        });
                      })()}>
                        <PolarGrid stroke="#dce7d4" />
                        <PolarAngleAxis dataKey="metric" tick={{ fill: "#556a44", fontSize: 11 }} />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#a7be95", fontSize: 10 }} />
                        {insights.crop_health_scores.map((c, i) => (
                          <Radar
                            key={c.crop}
                            name={c.crop}
                            dataKey={c.crop}
                            stroke={CHART_COLORS[i % CHART_COLORS.length]}
                            fill={CHART_COLORS[i % CHART_COLORS.length]}
                            fillOpacity={0.15}
                            strokeWidth={2}
                          />
                        ))}
                        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                        <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "1px solid #dce7d4", fontSize: 12 }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Status badges */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {insights.crop_health_scores.map((c) => (
                      <span
                        key={c.crop}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-semibold ${STATUS_STYLES[c.status] || "text-olive-600 bg-olive-50 border-olive-200"}`}
                      >
                        {c.crop}: {c.status} ({c.overall_health}%)
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Yield Forecast Area Chart */}
              {insights.yield_forecast && insights.yield_forecast.length > 0 && (
                <div className="bg-white rounded-2xl border border-olive-100 shadow-sm p-6">
                  <h3 className="text-lg font-bold text-olive-900 mb-1 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    Yield Forecast
                  </h3>
                  <p className="text-olive-500 text-sm mb-6">Predicted vs optimal yield over 12 months</p>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={insights.yield_forecast}>
                        <defs>
                          <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.olive600} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={COLORS.olive600} stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorOptimal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.2} />
                            <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef3ea" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#556a44", fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#a7be95", fontSize: 12 }} dx={-10} />
                        <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "1px solid #dce7d4", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: 12 }} />
                        <Area type="monotone" dataKey="optimal_yield" stroke={COLORS.blue} strokeWidth={2} strokeDasharray="5 5" fill="url(#colorOptimal)" name="Optimal Yield (kg)" />
                        <Area type="monotone" dataKey="predicted_yield" stroke={COLORS.olive600} strokeWidth={2.5} fill="url(#colorPredicted)" name="Predicted Yield (kg)" />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>

            {/* Charts Row 2: Resource Optimization + Soil Nutrients */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Resource Optimization */}
              {insights.resource_optimization && insights.resource_optimization.length > 0 && (
                <div className="bg-white rounded-2xl border border-olive-100 shadow-sm p-6">
                  <h3 className="text-lg font-bold text-olive-900 mb-1 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    Resource Optimization
                  </h3>
                  <p className="text-olive-500 text-sm mb-6">Current usage vs AI-recommended levels</p>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={insights.resource_optimization} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eef3ea" />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 11 }} />
                        <YAxis type="category" dataKey="resource" axisLine={false} tickLine={false} tick={{ fill: "#556a44", fontSize: 11 }} width={110} />
                        <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "1px solid #dce7d4", fontSize: 12 }} />
                        <Bar dataKey="current_usage" fill={COLORS.amber} radius={[0, 4, 4, 0]} name="Current" barSize={14} />
                        <Bar dataKey="recommended_usage" fill={COLORS.emerald} radius={[0, 4, 4, 0]} name="Recommended" barSize={14} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Savings summary */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {insights.resource_optimization.map((r) => (
                      <span key={r.resource} className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                        {r.resource}: {r.savings_percent > 0 ? `↓${r.savings_percent}%` : `↑${Math.abs(r.savings_percent)}%`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Soil Nutrient Analysis */}
              {insights.soil_nutrient_analysis && insights.soil_nutrient_analysis.length > 0 && (
                <div className="bg-white rounded-2xl border border-olive-100 shadow-sm p-6">
                  <h3 className="text-lg font-bold text-olive-900 mb-1 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                    Soil Nutrient Analysis
                  </h3>
                  <p className="text-olive-500 text-sm mb-6">Actual levels vs ideal range per nutrient</p>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={insights.soil_nutrient_analysis}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef3ea" />
                        <XAxis dataKey="nutrient" axisLine={false} tickLine={false} tick={{ fill: "#556a44", fontSize: 11 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#a7be95", fontSize: 11 }} dx={-10} />
                        <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "1px solid #dce7d4", fontSize: 12 }} />
                        <Bar dataKey="ideal_min" fill={COLORS.olive200} radius={[4, 4, 0, 0]} name="Ideal Min" barSize={18} />
                        <Bar dataKey="current_level" radius={[4, 4, 0, 0]} name="Current Level" barSize={18}>
                          {insights.soil_nutrient_analysis.map((entry, i) => (
                            <Cell
                              key={`cell-${i}`}
                              fill={
                                entry.status === "Optimal" ? COLORS.emerald
                                : entry.status === "Deficient" ? COLORS.red
                                : entry.status === "Excess" ? COLORS.purple
                                : COLORS.amber
                              }
                            />
                          ))}
                        </Bar>
                        <Bar dataKey="ideal_max" fill={COLORS.olive300} radius={[4, 4, 0, 0]} name="Ideal Max" barSize={18} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Status badges */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {insights.soil_nutrient_analysis.map((n) => (
                      <span key={n.nutrient} className={`text-xs px-2.5 py-1 rounded-lg border font-semibold ${STATUS_STYLES[n.status] || "text-olive-600 bg-olive-50 border-olive-200"}`}>
                        {n.nutrient}: {n.status}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Risk Assessment */}
            {insights.risk_assessment && insights.risk_assessment.length > 0 && (
              <div className="bg-white rounded-2xl border border-olive-100 shadow-sm p-6">
                <h3 className="text-lg font-bold text-olive-900 mb-1 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  Risk Assessment
                </h3>
                <p className="text-olive-500 text-sm mb-6">Identified risks with probability, impact, and mitigation strategies</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {insights.risk_assessment.map((r, i) => {
                    const severityColor = r.severity_score >= 7 ? "bg-red-500" : r.severity_score >= 4 ? "bg-amber-500" : "bg-emerald-500";
                    return (
                      <div key={i} className="rounded-xl border border-olive-100 p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-olive-100 text-olive-700 font-semibold">{r.category}</span>
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${severityColor}`} />
                            <span className="text-xs font-bold text-olive-800">{r.severity_score}/10</span>
                          </div>
                        </div>
                        <h4 className="font-bold text-olive-900 text-sm mb-2">{r.risk}</h4>
                        <div className="flex gap-2 mb-3">
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${r.probability === "High" ? "bg-red-100 text-red-700" : r.probability === "Medium" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                            P: {r.probability}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${r.impact === "High" ? "bg-red-100 text-red-700" : r.impact === "Medium" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                            I: {r.impact}
                          </span>
                        </div>
                        <p className="text-olive-600 text-xs leading-relaxed mb-2">{r.mitigation}</p>
                        <p className="text-olive-400 text-xs italic">{r.timeframe}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Seasonal Timeline */}
            {insights.seasonal_timeline && insights.seasonal_timeline.length > 0 && (
              <div className="bg-white rounded-2xl border border-olive-100 shadow-sm p-6">
                <h3 className="text-lg font-bold text-olive-900 mb-1 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                  Seasonal Activity Timeline
                </h3>
                <p className="text-olive-500 text-sm mb-6">Recommended weekly activities and priorities</p>
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-[18px] top-0 bottom-0 w-0.5 bg-olive-200" />
                  <div className="space-y-4">
                    {insights.seasonal_timeline.map((t, i) => {
                      const pStyle = PRIORITY_STYLES[t.priority] || PRIORITY_STYLES.Medium;
                      return (
                        <div key={i} className="flex gap-4 relative">
                          <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center z-10 border-2 ${pStyle.border} ${pStyle.bg}`}>
                            <span className={`text-xs font-bold ${pStyle.text}`}>{i + 1}</span>
                          </div>
                          <div className={`flex-1 rounded-xl border p-4 ${pStyle.border} ${pStyle.bg}`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-olive-800">{t.week}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${pStyle.text} bg-white/80 border ${pStyle.border}`}>{t.priority}</span>
                            </div>
                            <h4 className="font-bold text-olive-900 text-sm">{t.activity}</h4>
                            <p className="text-olive-600 text-xs mt-1 leading-relaxed">{t.details}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {insights.recommendations && insights.recommendations.length > 0 && (
              <div className="bg-white rounded-2xl border border-olive-100 shadow-sm p-6">
                <h3 className="text-lg font-bold text-olive-900 mb-1 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Actionable Recommendations
                </h3>
                <p className="text-olive-500 text-sm mb-6">AI-generated recommendations prioritized by impact</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {insights.recommendations.map((rec, i) => {
                    const pStyle = PRIORITY_STYLES[rec.priority] || PRIORITY_STYLES.Medium;
                    return (
                      <div key={i} className={`rounded-xl border p-5 ${pStyle.border} hover:shadow-md transition-shadow`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${pStyle.text} ${pStyle.bg}`}>
                              {rec.priority}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-olive-50 text-olive-600 font-medium border border-olive-100">
                              {rec.category}
                            </span>
                          </div>
                        </div>
                        <h4 className="font-bold text-olive-900 text-sm mb-2">{rec.title}</h4>
                        <p className="text-olive-600 text-sm leading-relaxed mb-3">{rec.description}</p>
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                            <polyline points="16 7 22 7 22 13" />
                          </svg>
                          {rec.expected_impact}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
