"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ChevronLeft, RefreshCw, AlertTriangle, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useMachineDetail } from "@/hooks/useMachineDetail"
import { useAIAnalysis } from "@/hooks/useAIAnalysis"
import { buildChartData, getThreshold } from "@/utils/chartUtils"
import { MachineTelemetryChart } from "@/components/dashboard/machine-telemetry-chart"
import { IncidentLogTable } from "@/components/dashboard/incident-log-table"
import { AIAnalysisCard } from "@/components/dashboard/ai-analysis-card"
import toast from "react-hot-toast"
import { api } from "@/lib/api"

export default function MachineDetailClient() {
    const { id } = useParams()
    const machineId = id as string
    const [currentPage, setCurrentPage] = useState(1)
    const [simulating, setSimulating] = useState(false)

    const aiAnalysis = useAIAnalysis(machineId)

    const {
        machine, history, incidents, loading,
        activeTab, setActiveTab, latestReading, activeIncidents,
        timeFrame, setTimeFrame, refresh,
        handleAcknowledge, handleResolve,
    } = useMachineDetail(machineId, () => {
        // Automatically trigger AI re-analysis when incidents are resolved or acknowledged
        aiAnalysis.reanalyze()
    })

    const handleSimulateAnomaly = async () => {
        setSimulating(true)
        const toastId = toast.loading("Mensimulasikan anomali sensor...")
        try {
            await api.post(`/api/v1/machines/${machineId}/simulate-anomaly`)
            toast.success("Anomali berhasil disimulasikan! Sensor mendeteksi kegagalan.", { id: toastId })
            refresh()
            // Immediately update AI Analysis card
            await aiAnalysis.reanalyze()
        } catch (err: any) {
            toast.error(`Gagal mensimulasikan anomali: ${err.message}`, { id: toastId })
        } finally {
            setSimulating(false)
        }
    }

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
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
                    {machine.status === "ACTIVE" && (
                        <Button
                            onClick={handleSimulateAnomaly}
                            disabled={simulating}
                            className="bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center gap-2 rounded-xl transition-all duration-200 shadow-sm md:self-center cursor-pointer"
                        >
                            <ShieldAlert className={cn("h-4 w-4", simulating && "animate-spin")} />
                            {simulating ? "Simulating Anomaly..." : "Simulasikan Anomali"}
                        </Button>
                    )}
                </div>
            </div>

            {/* Main grid: chart + sensor card */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <div className="xl:col-span-8 flex flex-col">
                    <MachineTelemetryChart
                        chartData={chartData}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        latestReading={latestReading}
                        hasActiveIncident={hasActiveIncident}
                        threshold={threshold}
                        timeFrame={timeFrame}
                        setTimeFrame={setTimeFrame}
                        hideTimeFrameToggle={true}
                    />
                </div>
                <div className="xl:col-span-4 flex flex-col gap-6">
                    <AIAnalysisCard
                        machineId={machineId}
                        analysis={aiAnalysis.analysis}
                        isLoading={aiAnalysis.isLoading}
                        isStale={aiAnalysis.isStale}
                        error={aiAnalysis.error}
                        reanalyze={aiAnalysis.reanalyze}
                    />
                </div>
            </div>

            {/* Incident log */}
            <IncidentLogTable
                incidents={incidents}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                onAcknowledge={handleAcknowledge}
                onResolve={handleResolve}
            />
        </div>
    )
}
