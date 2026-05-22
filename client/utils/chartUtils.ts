import { Machine, SensorReading, Incident } from "@/types/machine"

export interface ChartPoint {
    time: string
    historyValue: number | null
    predictiveValue: number | null
    range: [number, number] | null
    isPredictive: boolean
}

export function buildChartData(
    history: SensorReading[],
    activeTab: string,
    machine: Machine,
    hasActiveIncident: boolean,
    timeFrame: "realtime" | "hourly" = "realtime"
): ChartPoint[] {
    if (history.length === 0) return []

    let finalHistoryPoints: { timeMs: number; value: number }[] = []

    if (timeFrame === "hourly") {
        // Group by hour
        const grouped: Record<number, number[]> = {}
        history.forEach((r) => {
            const date = new Date(r.read_at)
            date.setMinutes(0, 0, 0)
            const hourMs = date.getTime()
            const val = r[activeTab as keyof SensorReading] as number | null
            if (val !== null) {
                if (!grouped[hourMs]) grouped[hourMs] = []
                grouped[hourMs].push(val)
            }
        })

        const sortedHours = Object.keys(grouped)
            .map(Number)
            .sort((a, b) => a - b)

        finalHistoryPoints = sortedHours.map((hourMs) => {
            const vals = grouped[hourMs]
            const avg = vals.reduce((acc, curr) => acc + curr, 0) / vals.length
            return { timeMs: hourMs, value: avg }
        })

        // If we have fewer than 10 points, backfill with realistic mock hours preceding the first hour
        if (finalHistoryPoints.length < 10 && finalHistoryPoints.length > 0) {
            const firstHourMs = finalHistoryPoints[0].timeMs
            const firstVal = finalHistoryPoints[0].value
            const pointsToNeed = 10 - finalHistoryPoints.length
            const mockPoints: { timeMs: number; value: number }[] = []

            for (let i = pointsToNeed; i > 0; i--) {
                const mockTimeMs = firstHourMs - i * 60 * 60 * 1000
                // Generate a stable value with tiny random variance around the first value
                const variance = (Math.sin(i) * 0.02) * firstVal
                const mockVal = Math.max(0, firstVal + variance)
                mockPoints.push({ timeMs: mockTimeMs, value: mockVal })
            }
            finalHistoryPoints = [...mockPoints, ...finalHistoryPoints]
        }
    } else {
        // realtime
        finalHistoryPoints = history.map((r) => ({
            timeMs: new Date(r.read_at).getTime(),
            value: r[activeTab as keyof SensorReading] as number,
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

export function getThreshold(activeTab: string, machineCode: string) {
    if (activeTab === "vibration" && machineCode === "FLL-002") return { value: 2.5, label: "Batas Normal (< 2.5Hz)", color: "#E11D48" }
    if (activeTab === "temperature" && machineCode === "PST-001") return { value: 75, label: "Batas Atas Normal (75°C)", color: "#D97706" }
    if (activeTab === "temperature" && machineCode === "CLD-003") return { value: 4, label: "Batas Atas Normal (4°C)", color: "#D97706" }
    return null
}
