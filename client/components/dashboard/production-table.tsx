"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Eye, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Machine {
    id: string
    name: string
    code: string
    type: string
    location: string | null
    status: "ACTIVE" | "INACTIVE" | "MAINTENANCE"
    created_at: string
}

interface SensorReading {
    id: string
    machine_id: string
    temperature: number | null
    vibration: number | null
    pressure: number | null
    rpm: number | null
    efficiency: number | null
    is_anomaly: boolean
    read_at: string
}

interface Incident {
    id: string
    machine_id: string
    title: string
    severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
    status: "OPEN" | "IN_PROGRESS" | "RESOLVED"
    risk_score: number
}

export function ProductionTable() {
    const router = useRouter()
    const [machines, setMachines] = useState<Machine[]>([])
    const [readings, setReadings] = useState<Record<string, SensorReading | null>>({})
    const [incidents, setIncidents] = useState<Incident[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    const loadData = async () => {
        try {
            const mList = await api.get<any, Machine[]>("/api/v1/machines")
            setMachines(mList || [])

            const iList = await api.get<any, Incident[]>("/api/v1/incidents?limit=100")
            setIncidents(iList || [])

            // Fetch latest reading for each machine in parallel
            if (mList && mList.length > 0) {
                const latestMap: Record<string, SensorReading | null> = {}
                await Promise.all(
                    mList.map(async (m) => {
                        try {
                            const res = await api.get<any, SensorReading | null>(
                                `/api/v1/machines/${m.id}/sensors/latest`
                            )
                            latestMap[m.id] = res
                        } catch (err) {
                            // If no telemetry has been ingested yet, store null
                            latestMap[m.id] = null
                        }
                    })
                )
                setReadings(latestMap)
            }
        } catch (err) {
            console.error("Gagal memuat status mesin:", err)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        loadData()
        const interval = setInterval(loadData, 5000)
        return () => clearInterval(interval)
    }, [])

    const handleRefresh = () => {
        setRefreshing(true)
        loadData()
    }

    // Filter machines by search query
    const filteredMachines = machines.filter(
        (m) =>
            m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (m.location && m.location.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    // Render telemetry based on machine configuration
    const renderTelemetry = (machine: Machine, reading: SensorReading | null) => {
        if (!reading) {
            return <span className="text-gray-400 italic text-xs">Offline / No Data</span>
        }

        const isOffline = machine.status !== "ACTIVE"
        if (isOffline) {
            return <span className="text-gray-400 italic text-xs">Mesin Dinonaktifkan</span>
        }

        // 1. Mesin Pasteurisasi #1 (PST-001) → normal 72-75°C
        if (machine.code === "PST-001") {
            const temp = reading.temperature ?? 0
            const isNormal = temp >= 72 && temp <= 75
            return (
                <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-gray-500">Suhu</span>
                    <span
                        className={cn(
                            "font-bold text-sm",
                            isNormal ? "text-emerald-600" : "text-rose-600"
                        )}
                    >
                        {temp.toFixed(1)}°C
                    </span>
                </div>
            )
        }

        // 2. Mesin Filling #2 (FLL-002) → normal < 2.5Hz
        if (machine.code === "FLL-002") {
            const vib = reading.vibration ?? 0
            const isNormal = vib < 2.5
            return (
                <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-gray-500">Getaran</span>
                    <span
                        className={cn(
                            "font-bold text-sm",
                            isNormal ? "text-emerald-600" : "text-rose-600"
                        )}
                    >
                        {vib.toFixed(2)} Hz
                    </span>
                </div>
            )
        }

        // 3. Conveyor Belt A (CNV-001) → RPM & Tekanan
        if (machine.code === "CNV-001") {
            const rpm = reading.rpm ?? 0
            const press = reading.pressure ?? 0
            return (
                <div className="flex gap-4">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-gray-500">RPM</span>
                        <span className="font-bold text-sm text-gray-800">{rpm}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-gray-500">Tekanan</span>
                        <span className="font-bold text-sm text-gray-800">{press.toFixed(2)} Bar</span>
                    </div>
                </div>
            )
        }

        // 4. Cold Storage #3 (CLD-003) → normal 2-4°C
        if (machine.code === "CLD-003") {
            const temp = reading.temperature ?? 0
            const isNormal = temp >= 2 && temp <= 4
            return (
                <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-gray-500">Suhu</span>
                    <span
                        className={cn(
                            "font-bold text-sm",
                            isNormal ? "text-emerald-600" : "text-rose-600"
                        )}
                    >
                        {temp.toFixed(1)}°C
                    </span>
                </div>
            )
        }

        // 5. Boiler Unit (BLR-001) → monitor tekanan & suhu
        if (machine.code === "BLR-001") {
            const temp = reading.temperature ?? 0
            const press = reading.pressure ?? 0
            return (
                <div className="flex gap-4">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-gray-500">Suhu</span>
                        <span className="font-bold text-sm text-gray-800">{temp.toFixed(1)}°C</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-gray-500">Tekanan</span>
                        <span className="font-bold text-sm text-gray-800">{press.toFixed(2)} Bar</span>
                    </div>
                </div>
            )
        }

        // Fallback
        return (
            <div className="text-xs text-gray-700">
                {reading.temperature && `Suhu: ${reading.temperature.toFixed(1)}°C`}
                {reading.vibration && ` | Vib: ${reading.vibration.toFixed(2)}Hz`}
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">
                        Status & Sensor Real-Time
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Daftar seluruh mesin virtual beserta parameter telemetri dan status terupdate.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="h-9 gap-2 border-gray-200 hover:bg-gray-50 bg-white"
                    >
                        <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Table wrapper */}
            <div className="bg-white/80 backdrop-blur-md rounded-xl border border-gray-200/80 shadow-md overflow-hidden">
                <div className="p-3 border-b border-gray-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="relative w-full sm:w-[350px]">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Cari Mesin (Nama, Kode, Lokasi)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-9 w-full pl-9 bg-gray-50/50 border-gray-200/80 focus-visible:ring-emerald-500 focus-visible:ring-1"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50/50 text-gray-400 font-semibold border-b border-gray-200/50 uppercase text-[10px] tracking-wider">
                            <tr>
                                <th className="px-5 py-4">Kode / Nama Mesin</th>
                                <th className="px-5 py-4">Lokasi</th>
                                <th className="px-5 py-4">Status Mesin</th>
                                <th className="px-5 py-4">Telemetri Terbaru</th>
                                <th className="px-5 py-4">Status Incident</th>
                                <th className="px-5 py-4 text-center">Aksi</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100/70">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                                        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-300" />
                                        Memuat data mesin real-time...
                                    </td>
                                </tr>
                            ) : filteredMachines.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                                        Tidak ada mesin yang cocok dengan pencarian.
                                    </td>
                                </tr>
                            ) : (
                                filteredMachines.map((m) => {
                                    const reading = readings[m.id]
                                    const activeIncidents = incidents.filter(
                                        (inc) =>
                                            inc.machine_id === m.id &&
                                            (inc.status === "OPEN" || inc.status === "IN_PROGRESS")
                                    )
                                    const hasActiveIncident = activeIncidents.length > 0
                                    const highestSeverityIncident = hasActiveIncident
                                        ? [...activeIncidents].sort((a, b) => {
                                            const severities = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
                                            return severities[b.severity] - severities[a.severity]
                                        })[0]
                                        : null

                                    const idx = machines.findIndex(x => x.id === m.id)
                                    const machineNum = idx !== -1 ? String(idx + 1) : m.id

                                    return (
                                        <tr
                                            key={m.id}
                                            className="hover:bg-gray-50/40 transition-colors group"
                                        >
                                            {/* Code & Name */}
                                            <td className="px-5 py-4 font-medium text-gray-900">
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-bold text-gray-400 tracking-wider">
                                                        {m.code}
                                                    </span>
                                                    <span className="text-gray-800 text-sm font-semibold group-hover:text-emerald-700 transition-colors">
                                                        {m.name}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Location */}
                                            <td className="px-5 py-4 text-gray-500 font-medium text-xs">
                                                {m.location || "-"}
                                            </td>

                                            {/* Status Badge */}
                                            <td className="px-5 py-4">
                                                <span
                                                    className={cn(
                                                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase",
                                                        m.status === "ACTIVE" && "bg-emerald-100 text-emerald-800",
                                                        m.status === "INACTIVE" && "bg-gray-100 text-gray-800",
                                                        m.status === "MAINTENANCE" && "bg-amber-100 text-amber-800"
                                                    )}
                                                >
                                                    {m.status}
                                                </span>
                                            </td>

                                            {/* Live Telemetry */}
                                            <td className="px-5 py-4">
                                                {renderTelemetry(m, reading || null)}
                                            </td>

                                            {/* Incident Status Badge */}
                                            <td className="px-5 py-4">
                                                {highestSeverityIncident ? (
                                                    <span
                                                        className={cn(
                                                            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase",
                                                            highestSeverityIncident.severity === "CRITICAL" && "bg-red-100 text-red-800 animate-pulse border border-red-200",
                                                            highestSeverityIncident.severity === "HIGH" && "bg-orange-100 text-orange-800 border border-orange-200",
                                                            highestSeverityIncident.severity === "MEDIUM" && "bg-yellow-100 text-yellow-800 border border-yellow-200",
                                                            highestSeverityIncident.severity === "LOW" && "bg-blue-100 text-blue-800 border border-blue-200"
                                                        )}
                                                    >
                                                        <AlertTriangle className="h-3 w-3 shrink-0" />
                                                        {highestSeverityIncident.severity} (Score: {highestSeverityIncident.risk_score})
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/50">
                                                        <CheckCircle className="h-3 w-3 shrink-0" />
                                                        Aman
                                                    </span>
                                                )}
                                            </td>

                                            {/* Action Button */}
                                            <td className="px-5 py-4 text-center">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => router.push(`/dashboard/operation/${machineNum}`)}
                                                    className="h-8 px-3 font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50/70 border border-transparent hover:border-emerald-200/40 rounded-lg cursor-pointer"
                                                >
                                                    <Eye className="h-3.5 w-3.5 mr-1" />
                                                    Detail
                                                </Button>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}