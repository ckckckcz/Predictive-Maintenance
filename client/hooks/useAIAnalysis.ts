"use client"

import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api"

export interface AIAnalysis {
    id: string
    machine_id: string
    risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
    risk_score: number
    health_percentage: number
    trend: "STABLE" | "INCREASING" | "DECREASING" | "SPIKE"
    prediction: string
    recommendation: string
    estimated_failure_hours: number | null
    urgent: boolean
    analyzed_at: string
}

interface UseAIAnalysisReturn {
    analysis: AIAnalysis | null
    isLoading: boolean
    isStale: boolean
    error: string | null
    reanalyze: () => Promise<void>
}

const STALE_THRESHOLD_MS = 30 * 60 * 1000 // 30 minutes

export function useAIAnalysis(machineId: string): UseAIAnalysisReturn {
    const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isStale, setIsStale] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchAnalysis = useCallback(async () => {
        if (!machineId) return
        try {
            const data = await api.get<never, AIAnalysis>(`/api/v1/machines/${machineId}/analysis`)
            setAnalysis(data)
            setError(null)
            const age = Date.now() - new Date(data.analyzed_at).getTime()
            setIsStale(age > STALE_THRESHOLD_MS)
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Gagal memuat analisis AI"
            setError(msg)
        } finally {
            setIsLoading(false)
        }
    }, [machineId])

    const reanalyze = useCallback(async () => {
        if (!machineId) return
        setIsLoading(true)
        setError(null)
        try {
            const data = await api.post<never, AIAnalysis>(`/api/v1/machines/${machineId}/analyze`)
            setAnalysis(data)
            setIsStale(false)
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Gagal menjalankan analisis AI"
            setError(msg)
        } finally {
            setIsLoading(false)
        }
    }, [machineId])

    // Initial fetch
    useEffect(() => {
        if (machineId) {
            setIsLoading(true)
            fetchAnalysis()
        } else {
            setIsLoading(false)
        }
    }, [machineId, fetchAnalysis])

    // Auto-refetch every 5 minutes
    useEffect(() => {
        if (!machineId) return
        const interval = setInterval(fetchAnalysis, 5 * 60 * 1000)
        return () => clearInterval(interval)
    }, [machineId, fetchAnalysis])

    return { analysis, isLoading, isStale, error, reanalyze }
}
