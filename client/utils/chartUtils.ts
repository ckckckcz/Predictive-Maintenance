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
    hasActiveIncident: boolean
): ChartPoint[] {
    if (history.length === 0) return []

    const historicalPoints: ChartPoint[] = history.map((r) => ({
        time: new Date(r.read_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        historyValue: r[activeTab as keyof SensorReading] as number,
        predictiveValue: null,
        range: null,
        isPredictive: false,
    }))

    const lastPoint = historicalPoints[historicalPoints.length - 1]
    const lastVal = lastPoint.historyValue as number
    lastPoint.predictiveValue = lastVal
    lastPoint.range = [lastVal, lastVal]

    let timeStepMs = 60 * 60 * 1000
    if (history.length >= 2) {
        const diff = new Date(history[history.length - 1].read_at).getTime() - new Date(history[history.length - 2].read_at).getTime()
        if (diff > 0 && diff < 86400000) timeStepMs = diff
    }

    const lastReadTime = new Date(history[history.length - 1].read_at).getTime()
    const uncertaintyMap: Record<string, number> = {
        temperature: machine.code === "CLD-003" ? 0.3 : 2,
        vibration: 0.4, pressure: 0.5, rpm: 40, efficiency: 1.5
    }
    const baseUncertainty = uncertaintyMap[activeTab] || 1

    const futurePoints: ChartPoint[] = Array.from({ length: 5 }, (_, i) => {
        const time = new Date(lastReadTime + (i + 1) * timeStepMs).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
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
        return { time, historyValue: null, predictiveValue: projectedVal, range: [clamp(projectedVal - u), clamp(projectedVal + u)], isPredictive: true }
    })

    return [...historicalPoints, ...futurePoints]
}

export function getThreshold(activeTab: string, machineCode: string) {
    if (activeTab === "vibration" && machineCode === "FLL-002") return { value: 2.5, label: "Batas Normal (< 2.5Hz)", color: "#E11D48" }
    if (activeTab === "temperature" && machineCode === "PST-001") return { value: 75, label: "Batas Atas Normal (75°C)", color: "#D97706" }
    if (activeTab === "temperature" && machineCode === "CLD-003") return { value: 4, label: "Batas Atas Normal (4°C)", color: "#D97706" }
    return null
}
