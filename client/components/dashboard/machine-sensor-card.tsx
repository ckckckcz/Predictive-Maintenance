"use client"

import { Activity, Thermometer, Settings, Zap, Gauge } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SensorReading } from "@/types/machine"

interface Props { reading: SensorReading | null }

const SENSOR_ROWS = [
    { key: "temperature", label: "Suhu", unit: "°C", icon: Thermometer, format: (v: number) => v.toFixed(1) },
    { key: "vibration", label: "Getaran", unit: "Hz", icon: Activity, format: (v: number) => v.toFixed(2) },
    { key: "pressure", label: "Tekanan", unit: "Bar", icon: Gauge, format: (v: number) => v.toFixed(2) },
    { key: "rpm", label: "RPM", unit: "", icon: Settings, format: (v: number) => String(v) },
    { key: "efficiency", label: "Efisiensi", unit: "%", icon: Zap, format: (v: number) => v.toFixed(1) },
]

export function MachineSensorCard({ reading }: Props) {
    return (
        <Card className="border-gray-200/80 shadow-md rounded-xl bg-white/70 backdrop-blur-md overflow-hidden">
            <CardHeader className="p-6 pb-2">
                <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-emerald-600" />
                    <CardTitle className="text-base font-bold text-gray-900">Nilai Pembacaan Terkini</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="flex flex-col">
                    {reading ? (
                        <>
                            {SENSOR_ROWS.map(({ key, label, unit, icon: Icon, format }) => {
                                const val = reading[key as keyof SensorReading] as number | null
                                if (val === null) return null
                                return (
                                    <div key={key} className="flex items-center justify-between px-6 py-[14px] border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{label}</span>
                                        </div>
                                        <div className="flex items-baseline gap-0.5">
                                            <span className="text-lg font-extrabold text-gray-800">{format(val)}</span>
                                            {unit && <span className="text-xs font-bold text-gray-500">{unit}</span>}
                                        </div>
                                    </div>
                                )
                            })}
                            <div className="flex items-center justify-between px-6 py-[14px] bg-gray-50/50">
                                <span className="text-[10px] text-gray-400 font-semibold uppercase">Diupdate Pada</span>
                                <span className="text-[10px] text-gray-500 font-mono font-bold">
                                    {new Date(reading.read_at).toLocaleTimeString("id-ID")}
                                </span>
                            </div>
                        </>
                    ) : (
                        <div className="px-6 py-8 text-center text-gray-400 text-xs">Tidak ada data sensor aktif</div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
