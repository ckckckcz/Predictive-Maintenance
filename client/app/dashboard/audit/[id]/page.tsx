"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ChevronLeft, RefreshCw, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useMachineDetail } from "@/hooks/useMachineDetail"
import { buildChartData, getThreshold } from "@/utils/chartUtils"
import { MachineTelemetryChart } from "@/components/dashboard/machine-telemetry-chart"
import { MachineSensorCard } from "@/components/dashboard/machine-sensor-card"
import { IncidentLogTable } from "@/components/dashboard/incident-log-table"
import { AIAnalysisCard } from "@/components/dashboard/ai-analysis-card"

export default function MachineDetailPage() {
    const { id } = useParams()
    const machineId = id as string
    const [currentPage, setCurrentPage] = useState(1)

    const {
        machine, history, incidents, loading,
        activeTab, setActiveTab, latestReading, activeIncidents,
        timeFrame, setTimeFrame,
    } = useMachineDetail(machineId)

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 bg-white/70 backdrop-blur-md rounded-2xl border border-gray-100">
                <RefreshCw className="h-8 w-8 text-emerald-500 animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Memuat data mesin & analisis...</p>
            </div>
        )
    }

    if (!machine) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white/70 backdrop-blur-md rounded-2xl border border-dashed border-gray-200 text-center">
                <AlertTriangle className="h-10 w-10 text-amber-500 mb-4 animate-bounce" />
                <h3 className="text-lg font-bold text-gray-900">Mesin Tidak Ditemukan</h3>
                <p className="text-gray-500 text-sm max-w-sm mb-6 mt-1">Mesin dengan ID yang diminta tidak terdaftar di sistem.</p>
                <Link href="/dashboard">
                    <Button className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold">Kembali ke Dashboard</Button>
                </Link>
            </div>
        )
    }

    const hasActiveIncident = activeIncidents.length > 0
    const chartData = buildChartData(history, activeTab, machine, hasActiveIncident, timeFrame)
    const threshold = getThreshold(activeTab, machine.code)

    return (
        <div className="space-y-6">
            {/* Header & breadcrumbs */}
            <div className="space-y-4">
                <div className="text-sm text-gray-500 flex items-center gap-2">
                    Home <span className="text-gray-300">/</span>
                    <span className="text-gray-500 font-medium">Operation</span>
                    <span className="text-gray-300">/</span>
                    <span className="text-gray-900 font-medium">{machine.code}</span>
                </div>
                <div className="flex items-start gap-4">
                    <Link href="/dashboard">
                        <Button variant="outline" size="icon" className="h-9 w-9 bg-white border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                            <ChevronLeft className="h-5 w-5 text-slate-600" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-gray-900">{machine.name}</h1>
                            <Badge className={cn(
                                "font-bold text-[10px] py-0.5 px-2.5 rounded-full uppercase tracking-wider border-none shadow-none text-white",
                                machine.status === "ACTIVE" && "bg-emerald-600",
                                machine.status === "MAINTENANCE" && "bg-amber-500",
                                machine.status === "INACTIVE" && "bg-slate-400"
                            )}>
                                {machine.status}
                            </Badge>
                        </div>
                        <p className="text-sm text-slate-500 font-medium mt-0.5">
                            {machine.code} <span className="text-slate-300 mx-1">•</span> {machine.location || "Lokasi tidak diatur"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Main grid: chart + sensor card */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <div className="xl:col-span-8">
                    <MachineTelemetryChart
                        chartData={chartData}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        latestReading={latestReading}
                        hasActiveIncident={hasActiveIncident}
                        threshold={threshold}
                        timeFrame={timeFrame}
                        setTimeFrame={setTimeFrame}
                    />
                </div>
                <div className="xl:col-span-4 flex flex-col gap-6">
                    <MachineSensorCard reading={latestReading} />
                    <AIAnalysisCard machineId={machineId} />
                </div>
            </div>

            {/* Incident log */}
            <IncidentLogTable
                incidents={incidents}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
            />
        </div>
    )
}
