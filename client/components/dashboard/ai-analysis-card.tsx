"use client"

import { useState } from "react"
import {
    Brain, RefreshCw, TrendingUp, TrendingDown, Minus, Zap,
    AlertTriangle, CheckCircle2, Clock, ShieldAlert, Heart
} from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useAIAnalysis, type AIAnalysis } from "@/hooks/useAIAnalysis"

// ─── Sub-components ──────────────────────────────────────────────────────────

function HealthMeter({ value }: { value: number }) {
    const color = value > 70 ? "#10b981" : value > 40 ? "#f59e0b" : "#ef4444"
    const radius = 54
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (value / 100) * circumference

    return (
        <div className="relative flex flex-col items-center gap-1">
            <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90">
                {/* Background track */}
                <circle cx="64" cy="64" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="10" />
                {/* Progress arc */}
                <circle
                    cx="64" cy="64" r={radius} fill="none"
                    stroke={color} strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    style={{ transition: "stroke-dashoffset 1s ease-out, stroke 0.5s" }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
                <span className="text-2xl font-black" style={{ color }}>{value}%</span>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Kesehatan</span>
            </div>
        </div>
    )
}

function TrendIcon({ trend }: { trend: AIAnalysis["trend"] }) {
    const map: Record<AIAnalysis["trend"], { icon: React.ReactNode; label: string; color: string }> = {
        STABLE:     { icon: <Minus className="h-4 w-4" />,       label: "Stabil",    color: "text-slate-500 bg-slate-100" },
        INCREASING: { icon: <TrendingUp className="h-4 w-4" />,  label: "Meningkat", color: "text-rose-600 bg-rose-50" },
        DECREASING: { icon: <TrendingDown className="h-4 w-4" />, label: "Menurun",  color: "text-emerald-600 bg-emerald-50" },
        SPIKE:      { icon: <Zap className="h-4 w-4" />,          label: "Lonjakan", color: "text-rose-600 bg-rose-50" },
    }
    const t = map[trend] ?? map.STABLE
    return (
        <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold", t.color)}>
            {t.icon}{t.label}
        </span>
    )
}

function RiskBadge({ level }: { level: AIAnalysis["risk_level"] }) {
    const map: Record<AIAnalysis["risk_level"], string> = {
        LOW:      "bg-emerald-100 text-emerald-800 border-emerald-200",
        MEDIUM:   "bg-yellow-100 text-yellow-800 border-yellow-200",
        HIGH:     "bg-orange-100 text-orange-800 border-orange-200",
        CRITICAL: "bg-rose-100 text-rose-800 border-rose-200",
    }
    return (
        <Badge className={cn("border font-bold text-xs px-2.5 py-1 rounded-full uppercase tracking-wide shadow-none", map[level])}>
            {level}
        </Badge>
    )
}

function FailureEstimate({ hours }: { hours: number | null }) {
    if (hours === null) {
        return (
            <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span className="text-sm font-semibold">Kondisi Aman ✅</span>
            </div>
        )
    }
    const color = hours <= 4 ? "text-rose-700" : hours <= 24 ? "text-amber-700" : "text-slate-600"
    const icon = hours <= 24 ? <AlertTriangle className="h-4 w-4 shrink-0" /> : <Clock className="h-4 w-4 shrink-0" />
    return (
        <div className={cn("flex items-center gap-2", color)}>
            {icon}
            <span className="text-sm font-semibold">⚠️ Estimasi failure: ~{hours} jam</span>
        </div>
    )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function AnalysisSkeleton() {
    return (
        <div className="animate-pulse space-y-4 p-1">
            <div className="flex gap-4 items-center">
                <div className="w-32 h-32 rounded-full bg-slate-100" />
                <div className="flex-1 space-y-3">
                    <div className="h-4 bg-slate-100 rounded w-1/3" />
                    <div className="h-3 bg-slate-100 rounded w-2/3" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
            </div>
            <div className="h-16 bg-slate-100 rounded-xl" />
            <div className="h-12 bg-slate-100 rounded-xl" />
        </div>
    )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface AIAnalysisCardProps {
    machineId: string
    analysis: AIAnalysis | null
    isLoading: boolean
    isStale: boolean
    error: string | null
    reanalyze: () => Promise<void>
}

export function AIAnalysisCard({ machineId, analysis, isLoading, isStale, error, reanalyze }: AIAnalysisCardProps) {
    const [reanalyzing, setReanalyzing] = useState(false)

    const handleReanalyze = async () => {
        setReanalyzing(true)
        await reanalyze()
        setReanalyzing(false)
    }

    const isUrgent = analysis?.urgent

    return (
        <Card className={cn(
            "border shadow-md rounded-xl overflow-hidden transition-all duration-300",
            isUrgent
                ? "border-rose-200 bg-gradient-to-br from-rose-50/80 to-white/90 shadow-rose-100"
                : "border-gray-200/80 bg-white/70 backdrop-blur-md"
        )}>
            <CardHeader className="p-5 pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={cn(
                            "flex items-center justify-center w-8 h-8 rounded-lg",
                            isUrgent ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
                        )}>
                            <Brain className="h-4 w-4" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-900">Analisis AI Prediktif</h3>
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                                Didukung Google Gemini
                            </p>
                        </div>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleReanalyze}
                        disabled={reanalyzing || isLoading}
                        className="h-8 text-xs font-semibold border-slate-200 hover:bg-slate-50 cursor-pointer"
                    >
                        <RefreshCw className={cn("h-3 w-3 mr-1.5", (reanalyzing || isLoading) && "animate-spin")} />
                        Analisis Ulang
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="p-5 pt-0">
                {isLoading && !analysis ? (
                    <AnalysisSkeleton />
                ) : error && !analysis ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
                        <ShieldAlert className="h-8 w-8 text-slate-300" />
                        <p className="text-sm text-slate-500 max-w-xs">Analisis AI belum tersedia. Klik &quot;Analisis Ulang&quot; untuk memulai.</p>
                    </div>
                ) : analysis ? (
                    <div className="space-y-4">
                        {/* Top: Health + Meta */}
                        <div className="flex items-center gap-5">
                            <HealthMeter value={analysis.health_percentage} />
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <RiskBadge level={analysis.risk_level} />
                                    <TrendIcon trend={analysis.trend} />
                                    {isUrgent && (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold text-rose-700 bg-rose-100">
                                            <AlertTriangle className="h-3 w-3" />Urgen
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 mb-0.5 font-medium">Risk Score</div>
                                    <div className="w-full bg-slate-100 rounded-full h-2">
                                        <div
                                            className={cn(
                                                "h-2 rounded-full transition-all duration-700",
                                                analysis.risk_score > 70 ? "bg-rose-500" :
                                                analysis.risk_score > 40 ? "bg-amber-400" : "bg-emerald-500"
                                            )}
                                            style={{ width: `${analysis.risk_score}%` }}
                                        />
                                    </div>
                                    <div className="text-right text-[10px] font-bold text-slate-500 mt-0.5">{analysis.risk_score}/100</div>
                                </div>
                                <FailureEstimate hours={analysis.estimated_failure_hours} />
                            </div>
                        </div>

                        {/* Prediction */}
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <Heart className="h-3.5 w-3.5 text-slate-500" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Prediksi Kondisi</span>
                            </div>
                            <p className="text-sm text-slate-700 leading-relaxed">{analysis.prediction}</p>
                        </div>

                        {/* Recommendation */}
                        <div className={cn(
                            "rounded-xl p-3.5 border",
                            isUrgent
                                ? "bg-rose-50 border-rose-200"
                                : "bg-amber-50 border-amber-200"
                        )}>
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <AlertTriangle className={cn("h-3.5 w-3.5", isUrgent ? "text-rose-600" : "text-amber-600")} />
                                <span className={cn("text-[10px] font-bold uppercase tracking-wide", isUrgent ? "text-rose-600" : "text-amber-700")}>
                                    Rekomendasi Tindakan
                                </span>
                            </div>
                            <p className={cn("text-sm leading-relaxed font-medium", isUrgent ? "text-rose-800" : "text-amber-900")}>
                                {analysis.recommendation}
                            </p>
                        </div>

                        {/* Footer: timestamp + stale indicator */}
                        <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                <Clock className="h-3 w-3" />
                                <span>
                                    Dianalisis: {new Date(analysis.analyzed_at).toLocaleString("id-ID", {
                                        day: "2-digit", month: "short", year: "numeric",
                                        hour: "2-digit", minute: "2-digit"
                                    })}
                                </span>
                            </div>
                            {isStale && (
                                <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                    Data Usang
                                </span>
                            )}
                        </div>
                    </div>
                ) : null}
            </CardContent>
        </Card>
    )
}
