"use client"

import { Activity, Thermometer, Settings, Zap, Gauge } from "lucide-react"
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    ComposedChart, Line, Area, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts"
import { ChartPoint, ThresholdConfig } from "@/utils/chartUtils"
import { SensorReading } from "@/types/machine"
import { cn } from "@/lib/utils"

interface Props {
    chartData: ChartPoint[]
    activeTab: string
    setActiveTab: (v: string) => void
    latestReading: SensorReading | null
    hasActiveIncident: boolean
    threshold: ThresholdConfig | null
    timeFrame: "realtime" | "hourly"
    setTimeFrame: (v: "realtime" | "hourly") => void
    hideTimeFrameToggle?: boolean
}

const TABS = [
    { value: "temperature", label: "Suhu (°C)", icon: Thermometer },
    { value: "vibration", label: "Getaran (Hz)", icon: Activity },
    { value: "pressure", label: "Tekanan (Bar)", icon: Gauge },
    { value: "rpm", label: "RPM", icon: Settings },
    { value: "efficiency", label: "Efisiensi (%)", icon: Zap },
]

export function MachineTelemetryChart({
    chartData,
    activeTab,
    setActiveTab,
    latestReading,
    hasActiveIncident,
    threshold,
    timeFrame,
    setTimeFrame,
    hideTimeFrameToggle = false,
}: Props) {
    const mainColor = hasActiveIncident ? "#991b1b" : "#059669"
    const predictiveColor = hasActiveIncident ? "#dc2626" : "#0d9488"
    const rangeFill = hasActiveIncident ? "#fee2e2" : "#ccfbf1"

    const enabledTabs = TABS.filter(t => latestReading?.[t.value as keyof SensorReading] !== null)

    const formatTooltipValue = (value: any) => {
        const round = (val: number) => {
            switch (activeTab) {
                case "temperature":
                case "efficiency":
                    return val.toFixed(1)
                case "vibration":
                case "pressure":
                    return val.toFixed(2)
                case "rpm":
                    return Math.round(val).toString()
                default:
                    return val.toFixed(1)
            }
        }

        if (Array.isArray(value)) {
            return value.map(v => typeof v === 'number' ? round(v) : v).join(" - ")
        }
        if (typeof value === 'number') {
            return round(value)
        }
        return value
    }

    return (
        <Card className="border-gray-200/80 shadow-md rounded-xl bg-white/70 backdrop-blur-md overflow-hidden h-full flex flex-col">
            <CardHeader className="p-6 pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-emerald-600" />
                            <h2 className="text-lg font-bold text-gray-900">
                                {timeFrame === "realtime" ? "Grafik Telemetri Real-Time" : "Grafik Telemetri Per Jam"}
                            </h2>
                        </div>
                        <CardDescription className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                            Histori & Batas Normal Sensor
                        </CardDescription>
                    </div>
                    {/* Interval Toggle */}
                    {!hideTimeFrameToggle && (
                        <div className="flex items-center gap-1 bg-gray-100/70 p-0.5 border border-slate-200/40 rounded-lg max-w-fit self-start sm:self-auto">
                            <button
                                onClick={() => setTimeFrame("realtime")}
                                className={cn(
                                    "px-3 py-1 text-xs font-bold rounded-md transition-all duration-150 cursor-pointer border border-transparent",
                                    timeFrame === "realtime"
                                        ? "bg-white text-emerald-700 shadow-sm border-slate-200/50"
                                        : "text-slate-500 hover:text-slate-800"
                                )}
                            >
                                Real-Time
                            </button>
                            <button
                                onClick={() => setTimeFrame("hourly")}
                                className={cn(
                                    "px-3 py-1 text-xs font-bold rounded-md transition-all duration-150 cursor-pointer border border-transparent",
                                    timeFrame === "hourly"
                                        ? "bg-white text-emerald-700 shadow-sm border-slate-200/50"
                                        : "text-slate-500 hover:text-slate-800"
                                )}
                            >
                                Per Jam
                            </button>
                        </div>
                    )}
                </div>
                <div className="mt-4">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="bg-gray-100/70 p-1 h-auto flex flex-wrap gap-1 border border-slate-200/40 rounded-xl max-w-fit">
                            {enabledTabs.map(tab => {
                                const Icon = tab.icon
                                return (
                                    <TabsTrigger key={tab.value} value={tab.value}
                                        className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer text-slate-600 hover:text-slate-900">
                                        <Icon className="h-3.5 w-3.5 mr-1 inline-block" />{tab.label}
                                    </TabsTrigger>
                                )
                            })}
                        </TabsList>
                    </Tabs>
                </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-[480px] p-6 pt-2">
                {chartData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <Activity className="h-8 w-8 mb-2 animate-pulse" />
                        <span>Tidak ada riwayat sensor yang tersedia untuk grafik.</span>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="time" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontWeight: 500 }} dy={10} />
                            <YAxis domain={['auto', 'auto']} fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontWeight: 500 }} dx={-10} />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 8px 30px rgba(0,0,0,0.05)', padding: '12px', backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
                                labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                                formatter={(value: any, name: any) => [formatTooltipValue(value), name]}
                            />
                            {threshold && (
                                <>
                                    {threshold.min !== undefined && (
                                        <ReferenceLine
                                            y={threshold.min}
                                            stroke="#d97706"
                                            strokeDasharray="5 5"
                                            label={{
                                                value: threshold.minLabel || `Min: ${threshold.min}`,
                                                fill: "#d97706",
                                                fontSize: 10,
                                                fontWeight: 'bold',
                                                position: 'insideBottomLeft'
                                            }}
                                        />
                                    )}
                                    {threshold.max !== undefined && (
                                        <ReferenceLine
                                            y={threshold.max}
                                            stroke="#ef4444"
                                            strokeDasharray="5 5"
                                            label={{
                                                value: threshold.maxLabel || `Max: ${threshold.max}`,
                                                fill: "#ef4444",
                                                fontSize: 10,
                                                fontWeight: 'bold',
                                                position: 'insideTopRight'
                                            }}
                                        />
                                    )}
                                </>
                            )}
                            <Area type="monotone" dataKey="range" stroke="none" fill={rangeFill} fillOpacity={hasActiveIncident ? 0.25 : 0.15} activeDot={false} name="Interval Kepercayaan (95%)" />
                            <Line
                                type="monotone"
                                dataKey="historyValue"
                                stroke={mainColor}
                                strokeWidth={3}
                                dot={(props: any) => {
                                    const { cx, cy, payload } = props
                                    if (payload && payload.isAnomaly) {
                                        return (
                                            <circle
                                                cx={cx}
                                                cy={cy}
                                                r={5.5}
                                                fill="#ef4444"
                                                stroke="#ffffff"
                                                strokeWidth={2}
                                                key={`dot-anomaly-${payload.time}-${cx}`}
                                                className="animate-pulse"
                                            />
                                        )
                                    }
                                    return (
                                        <circle
                                            cx={cx}
                                            cy={cy}
                                            r={3.5}
                                            fill={mainColor}
                                            stroke="#ffffff"
                                            strokeWidth={1.5}
                                            key={`dot-${payload.time}-${cx}`}
                                        />
                                    )
                                }}
                                activeDot={{ r: 5.5, strokeWidth: 0 }}
                                name={`${activeTab.toUpperCase()} (Aktual)`}
                                connectNulls={false}
                            />
                            <Line type="monotone" dataKey="predictiveValue" stroke={predictiveColor} strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 2.5, fill: predictiveColor, strokeWidth: 1, stroke: '#fff' }} activeDot={{ r: 4, strokeWidth: 0 }} name={`${activeTab.toUpperCase()} (Prediksi AI)`} connectNulls={true} />
                        </ComposedChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    )
}
