import { Machine, SensorReading, Incident } from "@/types/machine"

export interface ChartPoint {
    time: string
    historyValue: number | null
    predictiveValue: number | null
    range: [number, number] | null
    isPredictive: boolean
    isAnomaly?: boolean
}

export function buildChartData(
    history: SensorReading[],
    activeTab: string,
    machine: Machine,
    hasActiveIncident: boolean,
    timeFrame: "realtime" | "hourly" = "realtime"
): ChartPoint[] {
    if (history.length === 0) return []

    let finalHistoryPoints: { timeMs: number; value: number; isAnomaly?: boolean }[] = []

    if (timeFrame === "hourly") {
        // Group by hour
        const grouped: Record<number, number[]> = {}
        const groupedAnomalies: Record<number, boolean> = {}
        history.forEach((r) => {
            const date = new Date(r.read_at)
            date.setMinutes(0, 0, 0)
            const hourMs = date.getTime()
            const val = r[activeTab as keyof SensorReading] as number | null
            if (val !== null) {
                if (!grouped[hourMs]) grouped[hourMs] = []
                grouped[hourMs].push(val)
                if (r.is_anomaly) {
                    groupedAnomalies[hourMs] = true
                }
            }
        })

        const sortedHours = Object.keys(grouped)
            .map(Number)
            .sort((a, b) => a - b)

        finalHistoryPoints = sortedHours.map((hourMs) => {
            const vals = grouped[hourMs]
            const avg = vals.reduce((acc, curr) => acc + curr, 0) / vals.length
            return { timeMs: hourMs, value: avg, isAnomaly: !!groupedAnomalies[hourMs] }
        })

        // If we have fewer than 10 points, backfill with realistic mock hours preceding the first hour
        if (finalHistoryPoints.length < 10 && finalHistoryPoints.length > 0) {
            const firstHourMs = finalHistoryPoints[0].timeMs
            const firstVal = finalHistoryPoints[0].value
            const pointsToNeed = 10 - finalHistoryPoints.length
            const mockPoints: { timeMs: number; value: number; isAnomaly?: boolean }[] = []

            for (let i = pointsToNeed; i > 0; i--) {
                const mockTimeMs = firstHourMs - i * 60 * 60 * 1000
                // Generate a stable value with tiny random variance around the first value
                const variance = (Math.sin(i) * 0.02) * firstVal
                const mockVal = Math.max(0, firstVal + variance)
                mockPoints.push({ timeMs: mockTimeMs, value: mockVal, isAnomaly: false })
            }
            finalHistoryPoints = [...mockPoints, ...finalHistoryPoints]
        }
    } else {
        // realtime
        finalHistoryPoints = history.map((r) => ({
            timeMs: new Date(r.read_at).getTime(),
            value: r[activeTab as keyof SensorReading] as number,
            isAnomaly: r.is_anomaly,
        }))
    }

    const timeOptions: Intl.DateTimeFormatOptions = timeFrame === "hourly"
        ? { hour: "2-digit", minute: "2-digit" }
        : { hour: "2-digit", minute: "2-digit", second: "2-digit" }

    const historicalPoints: ChartPoint[] = finalHistoryPoints.map((p) => ({
        time: new Date(p.timeMs).toLocaleTimeString("id-ID", timeOptions),
        historyValue: p.value,
        predictiveValue: null,
        range: null,
        isPredictive: false,
        isAnomaly: p.isAnomaly,
    }))

    const lastPoint = historicalPoints[historicalPoints.length - 1]
    const lastVal = lastPoint.historyValue as number
    const lastTimeMs = finalHistoryPoints[finalHistoryPoints.length - 1].timeMs

    // Connect lines
    lastPoint.predictiveValue = lastVal
    lastPoint.range = [lastVal, lastVal]

    // Determine time step for future points
    let timeStepMs = 60 * 60 * 1000 // 1 hour
    if (timeFrame === "realtime") {
        timeStepMs = 30 * 1000 // default 30s
        if (history.length >= 2) {
            const diff = new Date(history[history.length - 1].read_at).getTime() - new Date(history[history.length - 2].read_at).getTime()
            if (diff > 0 && diff < 86400000) timeStepMs = diff
        }
    }

    const uncertaintyMap: Record<string, number> = {
        temperature: machine.code === "CLD-003" ? 0.3 : 2,
        vibration: 0.4, pressure: 0.5, rpm: 40, efficiency: 1.5
    }
    const baseUncertainty = uncertaintyMap[activeTab] || 1

    const futurePoints: ChartPoint[] = Array.from({ length: 5 }, (_, i) => {
        const futureTimeMs = lastTimeMs + (i + 1) * timeStepMs
        const time = new Date(futureTimeMs).toLocaleTimeString("id-ID", timeOptions)
        let projectedVal = lastVal

        if (hasActiveIncident) {
            const trendMap: Record<string, number> = { vibration: 0.65, pressure: 1.2, rpm: -120, efficiency: -5 }
            projectedVal = lastVal + (i + 1) * (trendMap[activeTab] ?? (activeTab === "temperature" ? (machine.code === "CLD-003" ? 0.7 : 3.2) : 0))
        } else {
            projectedVal = lastVal + Math.sin(i) * lastVal * 0.015
        }

        projectedVal = activeTab === "efficiency"
            ? Math.max(0, Math.min(100, projectedVal))
            : Math.max(0, projectedVal)

        const u = (i + 1) * baseUncertainty
        const clamp = (v: number) => activeTab === "efficiency" ? Math.max(0, Math.min(100, v)) : Math.max(0, v)
        return {
            time,
            historyValue: null,
            predictiveValue: projectedVal,
            range: [clamp(projectedVal - u), clamp(projectedVal + u)],
            isPredictive: true
        }
    })

    return [...historicalPoints, ...futurePoints]
}

export interface ThresholdConfig {
    min?: number
    max?: number
    minLabel?: string
    maxLabel?: string
}

export function getThreshold(activeTab: string, machineCode: string): ThresholdConfig | null {
    switch (machineCode) {
        case "PST-001":
            if (activeTab === "temperature") return { min: 72.0, max: 75.0, minLabel: "Min Normal (72°C)", maxLabel: "Max Normal (75°C)" }
            break
        case "FLL-002":
            if (activeTab === "vibration") return { max: 2.5, maxLabel: "Batas Atas (2.5Hz)" }
            break
        case "CNV-001":
            if (activeTab === "rpm") return { min: 800, max: 1200, minLabel: "Min Normal (800 RPM)", maxLabel: "Max Normal (1200 RPM)" }
            if (activeTab === "pressure") return { min: 1.5, max: 4.0, minLabel: "Min Normal (1.5 Bar)", maxLabel: "Max Normal (4.0 Bar)" }
            break
        case "CLD-003":
            if (activeTab === "temperature") return { min: 2.0, max: 4.0, minLabel: "Min Normal (2°C)", maxLabel: "Max Normal (4°C)" }
            break
        case "BLR-001":
            if (activeTab === "temperature") return { min: 90.0, max: 110.0, minLabel: "Min Normal (90°C)", maxLabel: "Max Normal (110°C)" }
            if (activeTab === "pressure") return { min: 2.0, max: 6.0, minLabel: "Min Normal (2.0 Bar)", maxLabel: "Max Normal (6.0 Bar)" }
            break
    }
    if (activeTab === "efficiency") return { min: 80.0, minLabel: "Min Efisiensi (80%)" }
    return null
}
