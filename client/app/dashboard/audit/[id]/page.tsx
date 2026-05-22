"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
    ChevronLeft,
    ChevronRight,
    Activity,
    Thermometer,
    Settings,
    Zap,
    AlertTriangle,
    CheckCircle,
    Clock,
    RefreshCw,
    TrendingUp,
    Gauge,
    ShieldAlert,
} from "lucide-react"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine
} from "recharts"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/lib/api"
import toast from "react-hot-toast"
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
    description: string | null
    severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
    status: "OPEN" | "IN_PROGRESS" | "RESOLVED"
    risk_score: number
    created_at: string
    acknowledged_at: string | null
    resolved_at: string | null
}

export default function MachineDetailPage() {
    const params = useParams()
    const router = useRouter()
    const machineId = params.id as string

    const [machine, setMachine] = useState<Machine | null>(null)
    const [history, setHistory] = useState<SensorReading[]>([])
    const [incidents, setIncidents] = useState<Incident[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<string>("efficiency")
    const [userRole, setUserRole] = useState<string | null>(null)
    const [currentPage, setCurrentPage] = useState(1)

    const fetchUserRole = () => {
        if (typeof window !== "undefined") {
            const userStr = localStorage.getItem("user")
            if (userStr) {
                try {
                    const user = JSON.parse(userStr)
                    setUserRole(user.role)
                } catch (e) {
                    console.error("Gagal parse role:", e)
                }
            }
        }
    }

    const loadData = async () => {
        try {
            const [mDetails, mHistory, mIncidents] = await Promise.all([
                api.get<any, Machine>(`/api/v1/machines/${machineId}`),
                api.get<any, SensorReading[]>(`/api/v1/machines/${machineId}/sensors/history?limit=30`),
                api.get<any, Incident[]>(`/api/v1/incidents?machine_id=${machineId}&limit=100`)
            ])

            setMachine(mDetails)

            // Sort telemetry history by timestamp ascending for chart mapping
            const sorted = (mHistory || []).sort(
                (a, b) => new Date(a.read_at).getTime() - new Date(b.read_at).getTime()
            )
            setHistory(sorted)

            setIncidents(mIncidents || [])

            // Determine default metric tab based on machine type
            if (mDetails) {
                if (mDetails.code === "PST-001" || mDetails.code === "CLD-003") {
                    setActiveTab("temperature")
                } else if (mDetails.code === "FLL-002") {
                    setActiveTab("vibration")
                } else if (mDetails.code === "CNV-001") {
                    setActiveTab("rpm")
                } else if (mDetails.code === "BLR-001") {
                    setActiveTab("pressure")
                }
            }
        } catch (err: any) {
            console.error("Gagal memuat detail mesin:", err)
            toast.error("Gagal memuat detail mesin: " + err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUserRole()
        setCurrentPage(1)
        loadData()

        const interval = setInterval(loadData, 5000)
        return () => clearInterval(interval)
    }, [machineId])

    // Acknowledge incident handler
    const handleAcknowledge = async (incidentId: string) => {
        const toastId = toast.loading("Mengakui insiden...")
        try {
            await api.post(`/api/v1/incidents/${incidentId}/acknowledge`)
            toast.success("Insiden diakui, status: IN_PROGRESS", { id: toastId })
            loadData()
        } catch (err: any) {
            toast.error(`Gagal mengakui insiden: ${err.message}`, { id: toastId })
        }
    }

    // Resolve incident handler
    const handleResolve = async (incidentId: string) => {
        const toastId = toast.loading("Menyelesaikan insiden...")
        try {
            await api.post(`/api/v1/incidents/${incidentId}/resolve`)
            toast.success("Insiden diselesaikan, status: RESOLVED", { id: toastId })
            loadData()
        } catch (err: any) {
            toast.error(`Gagal menyelesaikan insiden: ${err.message}`, { id: toastId })
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
                <p className="text-gray-500 text-sm max-w-sm mb-6 mt-1">
                    Mesin dengan ID yang diminta tidak terdaftar di sistem.
                </p>
                <Link href="/dashboard">
                    <Button className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold">
                        Kembali ke Dashboard
                    </Button>
                </Link>
            </div>
        )
    }

    // Latest reading from sorted array
    const latestReading = history.length > 0 ? history[history.length - 1] : null

    // Get active incidents
    const activeIncidents = incidents.filter(
        (inc) => inc.status === "OPEN" || inc.status === "IN_PROGRESS"
    )

    // Pagination logic
    const itemsPerPage = 10
    const sortedIncidents = [...incidents].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    const totalItems = sortedIncidents.length
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    const activePage = Math.min(currentPage, Math.max(1, totalPages))
    const startIndex = (activePage - 1) * itemsPerPage
    const paginatedIncidents = sortedIncidents.slice(startIndex, startIndex + itemsPerPage)

    const getPageNumbers = () => {
        const pages = []
        const maxVisible = 5
        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i)
        } else {
            if (activePage <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i)
                pages.push("...")
                pages.push(totalPages)
            } else if (activePage >= totalPages - 2) {
                pages.push(1)
                pages.push("...")
                for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
            } else {
                pages.push(1)
                pages.push("...")
                pages.push(activePage - 1)
                pages.push(activePage)
                pages.push(activePage + 1)
                pages.push("...")
                pages.push(totalPages)
            }
        }
        return pages
    }

    // Setup tabs based on metrics available
    const tabsList = [
        { value: "temperature", label: "Suhu (°C)", icon: Thermometer, enabled: latestReading?.temperature !== null },
        { value: "vibration", label: "Getaran (Hz)", icon: Activity, enabled: latestReading?.vibration !== null },
        { value: "pressure", label: "Tekanan (Bar)", icon: Gauge, enabled: latestReading?.pressure !== null },
        { value: "rpm", label: "RPM", icon: Settings, enabled: latestReading?.rpm !== null },
        { value: "efficiency", label: "Efisiensi (%)", icon: Zap, enabled: latestReading?.efficiency !== null },
    ].filter(t => t.enabled)

    // Format chart date time
    const chartFormattedData = history.map((reading) => {
        const timeStr = new Date(reading.read_at).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        })
        return {
            time: timeStr,
            value: reading[activeTab as keyof SensorReading] as number
        }
    })

    // Setup thresholds / reference lines
    let thresholdValue: number | null = null
    let thresholdLabel = ""
    let thresholdColor = ""

    if (activeTab === "vibration" && machine.code === "FLL-002") {
        thresholdValue = 2.5
        thresholdLabel = "Batas Normal (< 2.5Hz)"
        thresholdColor = "#E11D48" // red-600
    } else if (activeTab === "temperature") {
        if (machine.code === "PST-001") {
            thresholdValue = 75
            thresholdLabel = "Batas Atas Normal (75°C)"
            thresholdColor = "#D97706" // amber-600
        } else if (machine.code === "CLD-003") {
            thresholdValue = 4
            thresholdLabel = "Batas Atas Normal (4°C)"
            thresholdColor = "#D97706"
        }
    }

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
                            <Badge
                                className={cn(
                                    "font-bold text-[10px] py-0.5 px-2.5 rounded-full uppercase tracking-wider border-none shadow-none text-white",
                                    machine.status === "ACTIVE" && "bg-emerald-600",
                                    machine.status === "MAINTENANCE" && "bg-amber-500",
                                    machine.status === "INACTIVE" && "bg-slate-400"
                                )}
                            >
                                {machine.status}
                            </Badge>
                        </div>
                        <p className="text-sm text-slate-500 font-medium mt-0.5">
                            {machine.code} <span className="text-slate-300 mx-1">•</span> {machine.location || "Lokasi tidak diatur"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Grid for content */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

                {/* Chart Section */}
                <div className="xl:col-span-8 space-y-6">
                    <Card className="border-gray-200/80 shadow-md rounded-xl bg-white/70 backdrop-blur-md overflow-hidden">
                        <CardHeader className="p-6 pb-2">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-emerald-600" />
                                    <h2 className="text-lg font-bold text-gray-900">Grafik Telemetri Real-Time</h2>
                                </div>
                                <CardDescription className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                                    Histori & Batas Normal Sensor
                                </CardDescription>
                            </div>
                            <div className="mt-4">
                                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                    <TabsList className="bg-gray-100/70 p-1 h-auto flex flex-wrap gap-1 border border-slate-200/40 rounded-xl max-w-fit">
                                        {tabsList.map(tab => {
                                            const TabIcon = tab.icon
                                            return (
                                                <TabsTrigger
                                                    key={tab.value}
                                                    value={tab.value}
                                                    className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer text-slate-600 hover:text-slate-900"
                                                >
                                                    <TabIcon className="h-3.5 w-3.5 mr-1 inline-block" />
                                                    {tab.label}
                                                </TabsTrigger>
                                            )
                                        })}
                                    </TabsList>
                                </Tabs>
                            </div>
                        </CardHeader>

                        <CardContent className="h-[380px] p-6 pt-2">
                            {chartFormattedData.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <Activity className="h-8 w-8 mb-2 animate-pulse" />
                                    <span>Tidak ada riwayat sensor yang tersedia untuk grafik.</span>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartFormattedData} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="time"
                                            fontSize={10}
                                            tickLine={false}
                                            axisLine={false}
                                            tick={{ fill: '#94a3b8', fontWeight: 500 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            fontSize={10}
                                            tickLine={false}
                                            axisLine={false}
                                            tick={{ fill: '#94a3b8', fontWeight: 500 }}
                                            dx={-10}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: '1px solid #e2e8f0',
                                                boxShadow: '0 8px 30px rgba(0,0,0,0.05)',
                                                padding: '12px',
                                                backgroundColor: 'rgba(255, 255, 255, 0.95)'
                                            }}
                                            labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                                        />
                                        {thresholdValue !== null && (
                                            <ReferenceLine
                                                y={thresholdValue}
                                                stroke={thresholdColor}
                                                strokeDasharray="5 5"
                                                label={{
                                                    value: thresholdLabel,
                                                    fill: thresholdColor,
                                                    fontSize: 10,
                                                    fontWeight: 'bold',
                                                    position: 'top'
                                                }}
                                            />
                                        )}
                                        <Line
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#059669" // emerald-600
                                            strokeWidth={3}
                                            dot={{ r: 3, fill: '#059669', strokeWidth: 1.5, stroke: '#fff' }}
                                            activeDot={{ r: 5, strokeWidth: 0 }}
                                            name={activeTab.toUpperCase()}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right side info column */}
                <div className="xl:col-span-4 space-y-6">
                    {/* Current metrics */}
                    <Card className="border-gray-200/80 shadow-md rounded-xl bg-white/70 backdrop-blur-md overflow-hidden">
                        <CardHeader className="p-6 pb-2">
                            <div className="flex items-center gap-2">
                                <Activity className="h-4 w-4 text-emerald-600" />
                                <CardTitle className="text-base font-bold text-gray-900">Nilai Pembacaan Terkini</CardTitle>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            <div className="flex flex-col">
                                {latestReading ? (
                                    <>
                                        {/* Temperature */}
                                        {latestReading.temperature !== null && (
                                            <div className="flex items-center justify-between px-6 py-[14px] border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                                                        <Thermometer className="h-4 w-4" />
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Suhu</span>
                                                </div>
                                                <div className="flex items-baseline gap-0.5">
                                                    <span className="text-lg font-extrabold text-gray-800">{latestReading.temperature.toFixed(1)}</span>
                                                    <span className="text-xs font-bold text-gray-500">°C</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Vibration */}
                                        {latestReading.vibration !== null && (
                                            <div className="flex items-center justify-between px-6 py-[14px] border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                                                        <Activity className="h-4 w-4" />
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Getaran</span>
                                                </div>
                                                <div className="flex items-baseline gap-0.5">
                                                    <span className="text-lg font-extrabold text-gray-800">{latestReading.vibration.toFixed(2)}</span>
                                                    <span className="text-xs font-bold text-gray-500">Hz</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Pressure */}
                                        {latestReading.pressure !== null && (
                                            <div className="flex items-center justify-between px-6 py-[14px] border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                                                        <Gauge className="h-4 w-4" />
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Tekanan</span>
                                                </div>
                                                <div className="flex items-baseline gap-0.5">
                                                    <span className="text-lg font-extrabold text-gray-800">{latestReading.pressure.toFixed(2)}</span>
                                                    <span className="text-xs font-bold text-gray-500">Bar</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* RPM */}
                                        {latestReading.rpm !== null && (
                                            <div className="flex items-center justify-between px-6 py-[14px] border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                                                        <Settings className="h-4 w-4 animate-spin-slow" />
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">RPM</span>
                                                </div>
                                                <span className="text-lg font-extrabold text-gray-800">{latestReading.rpm}</span>
                                            </div>
                                        )}

                                        {/* Efficiency */}
                                        {latestReading.efficiency !== null && (
                                            <div className="flex items-center justify-between px-6 py-[14px] border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                                                        <Zap className="h-4 w-4" />
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Efisiensi</span>
                                                </div>
                                                <div className="flex items-baseline gap-0.5">
                                                    <span className="text-lg font-extrabold text-gray-800">{latestReading.efficiency.toFixed(1)}</span>
                                                    <span className="text-xs font-bold text-gray-500">%</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Timestamp updated */}
                                        <div className="flex items-center justify-between px-6 py-[14px] bg-gray-50/50">
                                            <span className="text-[10px] text-gray-400 font-semibold uppercase">Diupdate Pada</span>
                                            <span className="text-[10px] text-gray-500 font-mono font-bold">
                                                {new Date(latestReading.read_at).toLocaleTimeString("id-ID")}
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="px-6 py-8 text-center text-gray-400 text-xs">
                                        Tidak ada data sensor aktif
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Active Incidents & Operator Controls */}
            <div className="grid grid-cols-1 gap-6">
                {activeIncidents.length === 0 && (
                    <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-5 flex gap-4 items-start animate-in fade-in duration-300">
                        <div className="bg-emerald-600 rounded-xl p-2.5 h-fit shadow-md shadow-emerald-100">
                            <CheckCircle className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex flex-col gap-1 pt-0.5">
                            <h3 className="text-emerald-900 font-extrabold text-sm">Peralatan Beroperasi Stabil</h3>
                            <p className="text-emerald-700 text-xs font-semibold leading-relaxed">
                                Tidak ada incident aktif terdeteksi pada mesin ini. Sistem AI memantau seluruh pembacaan sensor dan mendeteksi kondisi sehat.
                            </p>
                        </div>
                    </div>
                )}

                {incidents.length > 0 && (
                    <Card className="border border-gray-200 shadow-sm bg-white overflow-hidden animate-in slide-in-from-top-4 duration-300">
                        <CardHeader className="pb-3 border-b border-gray-100 bg-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                        <div className="bg-slate-50 rounded-lg p-1.5 border border-slate-200">
                                            <AlertTriangle className="h-4 w-4 text-slate-600" />
                                        </div>
                                        Log Riwayat Anomali ({incidents.length})
                                    </CardTitle>
                                    <CardDescription className="text-xs mt-1 text-gray-500">
                                        Seluruh catatan historis deteksi anomali dan status incident pada mesin ini.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-200 bg-gray-50/75 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                            <th className="px-6 py-3.5 font-semibold">Tingkat Kerawanan</th>
                                            <th className="px-6 py-3.5 font-semibold">Deskripsi Anomali</th>
                                            <th className="px-6 py-3.5 font-semibold">Waktu Kejadian</th>
                                            <th className="px-6 py-3.5 font-semibold">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {paginatedIncidents.map((incident) => (
                                            <tr key={incident.id} className="hover:bg-gray-50/50 transition-colors text-xs">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <Badge className={cn(
                                                        "font-extrabold text-[10px] tracking-wider border px-2.5 py-0.5 rounded-full hover:opacity-90 shadow-none",
                                                        incident.severity === "CRITICAL" ? "bg-rose-50 text-rose-700 border-rose-200" :
                                                            incident.severity === "HIGH" ? "bg-orange-50 text-orange-700 border-orange-200" :
                                                                incident.severity === "MEDIUM" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                                                    "bg-blue-50 text-blue-700 border-blue-200"
                                                    )}>
                                                        {incident.severity} (Score: {incident.risk_score})
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1 max-w-lg">
                                                        <span className="font-bold text-gray-900 text-[13px]">{incident.title}</span>
                                                        <span className="text-gray-500 font-medium leading-relaxed">
                                                            {incident.description || "Anomali terdeteksi oleh analisis proaktif AI. Membutuhkan konfirmasi lapangan."}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-mono">
                                                    {new Date(incident.created_at).toLocaleString("id-ID")}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <Badge className={cn(
                                                        "font-extrabold text-[9px] px-2 py-0.5 border rounded-md shadow-none",
                                                        incident.status === "OPEN" ? "bg-red-50 text-red-600 border-red-200" :
                                                            incident.status === "IN_PROGRESS" ? "bg-amber-50 text-amber-600 border-amber-200" :
                                                                "bg-emerald-50 text-emerald-600 border-emerald-200"
                                                    )}>
                                                        {incident.status}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/30">
                                    <div className="text-xs text-gray-500 font-medium">
                                        Menampilkan <span className="font-semibold text-gray-800">{startIndex + 1}</span> -{" "}
                                        <span className="font-semibold text-gray-800">
                                            {Math.min(startIndex + itemsPerPage, totalItems)}
                                        </span>{" "}
                                        dari <span className="font-semibold text-gray-800">{totalItems}</span> log
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8 rounded-lg border-gray-200 bg-white hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                                            disabled={activePage === 1}
                                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        >
                                            <ChevronLeft className="h-4 w-4 text-slate-600" />
                                        </Button>

                                        {getPageNumbers().map((page, idx) => {
                                            if (page === "...") {
                                                return (
                                                    <span key={`dots-${idx}`} className="px-2 text-xs text-gray-400 font-bold">
                                                        ...
                                                    </span>
                                                )
                                            }
                                            const pageNum = page as number
                                            return (
                                                <Button
                                                    key={pageNum}
                                                    variant={activePage === pageNum ? "default" : "outline"}
                                                    className={cn(
                                                        "h-8 w-8 text-xs font-bold rounded-lg cursor-pointer",
                                                        activePage === pageNum
                                                            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-none border-none"
                                                            : "border-gray-200 bg-white text-slate-600 hover:bg-slate-50"
                                                    )}
                                                    onClick={() => setCurrentPage(pageNum)}
                                                >
                                                    {pageNum}
                                                </Button>
                                            )
                                        })}

                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8 rounded-lg border-gray-200 bg-white hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                                            disabled={activePage === totalPages}
                                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        >
                                            <ChevronRight className="h-4 w-4 text-slate-600" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
