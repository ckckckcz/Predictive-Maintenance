"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import toast from "react-hot-toast"
import {
    Activity,
    Thermometer,
    Zap,
    RefreshCw,
    Snowflake,
    Flame,
    Lock,
    Unlock,
    AlertTriangle,
    CheckCircle,
    Clock,
    XCircle,
    Info,
    ShieldAlert
} from "lucide-react"
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as ChartTooltip,
    Legend,
    ReferenceLine
} from "recharts"

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
    machine_name?: string
    machine_code?: string
}

export default function SimulationDashboard() {
    const [machines, setMachines] = useState<Machine[]>([])
    const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null)
    const [telemetryHistory, setTelemetryHistory] = useState<SensorReading[]>([])
    const [incidents, setIncidents] = useState<Incident[]>([])
    const [userRole, setUserRole] = useState<string | null>(null)
    const [isMounted, setIsMounted] = useState(false)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<string>("efficiency")

    // Get current user and role
    useEffect(() => {
        setIsMounted(true)
        if (typeof window !== "undefined") {
            const userStr = localStorage.getItem("user")
            if (userStr) {
                try {
                    const user = JSON.parse(userStr)
                    setUserRole(user.role)
                } catch (e) {
                    // Ignore
                }
            }
        }
    }, [])

    // Initial load
    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true)
            try {
                const machineList = await api.get<any, Machine[]>("/api/v1/machines")
                setMachines(machineList || [])
                if (machineList && machineList.length > 0) {
                    setSelectedMachineId(machineList[0].id)
                }
            } catch (err: any) {
                toast.error("Gagal memuat daftar mesin: " + err.message)
            } finally {
                setLoading(false)
            }
        }

        loadInitialData()
    }, [])

    // Function to poll machines list
    const fetchMachinesStatus = async () => {
        try {
            const machineList = await api.get<any, Machine[]>("/api/v1/machines")
            setMachines(machineList || [])
        } catch (err) {
            // Silence background poll errors
        }
    }

    // Function to fetch telemetry and incidents for the selected machine
    const fetchSelectedMachineData = async (machineId: string) => {
        try {
            // Fetch latest 30 readings for charts
            const history = await api.get<any, SensorReading[]>(`/api/v1/machines/${machineId}/sensors/history?limit=30`)
            // Sort ascending by read_at for the chart timeline
            const sortedHistory = (history || []).sort(
                (a, b) => new Date(a.read_at).getTime() - new Date(b.read_at).getTime()
            )
            setTelemetryHistory(sortedHistory)

            // Fetch incidents for the selected machine
            const machineIncidents = await api.get<any, Incident[]>(`/api/v1/incidents?machine_id=${machineId}`)
            setIncidents(machineIncidents || [])
        } catch (err) {
            // Silence background poll errors
        }
    }

    // Poll data periodically (every 5 seconds)
    useEffect(() => {
        if (!selectedMachineId) return

        // Fetch immediately on change
        fetchSelectedMachineData(selectedMachineId)

        const interval = setInterval(() => {
            fetchMachinesStatus()
            fetchSelectedMachineData(selectedMachineId)
        }, 5000)

        return () => clearInterval(interval)
    }, [selectedMachineId])

    // Toggle machine ON/OFF
    const handleToggleStatus = async (machineId: string, currentStatus: string) => {
        if (userRole !== "SUPERVISOR") {
            toast.error("Akses Ditolak: Anda membutuhkan peran SUPERVISOR untuk mengontrol status mesin.")
            return
        }

        const targetStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE"
        const toastId = toast.loading(`Mengubah status mesin menjadi ${targetStatus}...`)

        try {
            await api.patch(`/api/v1/machines/${machineId}/status`, {
                status: targetStatus,
            })
            toast.success(`Mesin berhasil di-${targetStatus === "ACTIVE" ? "hidupkan" : "matikan"}`, { id: toastId })
            fetchMachinesStatus()
        } catch (err: any) {
            toast.error(`Gagal mengubah status: ${err.message}`, { id: toastId })
        }
    }

    // Handle Acknowledge Incident
    const handleAcknowledge = async (incidentId: string) => {
        const toastId = toast.loading("Mengakui insiden...")
        try {
            await api.post(`/api/v1/incidents/${incidentId}/acknowledge`)
            toast.success("Insiden diakui, status: IN_PROGRESS", { id: toastId })
            if (selectedMachineId) fetchSelectedMachineData(selectedMachineId)
        } catch (err: any) {
            toast.error(`Gagal mengakui insiden: ${err.message}`, { id: toastId })
        }
    }

    // Handle Resolve Incident
    const handleResolve = async (incidentId: string) => {
        const toastId = toast.loading("Menyelesaikan insiden...")
        try {
            await api.post(`/api/v1/incidents/${incidentId}/resolve`)
            toast.success("Insiden diselesaikan, status: RESOLVED", { id: toastId })
            if (selectedMachineId) fetchSelectedMachineData(selectedMachineId)
        } catch (err: any) {
            toast.error(`Gagal menyelesaikan insiden: ${err.message}`, { id: toastId })
        }
    }

    // Determine default tab based on machine properties
    const selectedMachine = machines.find((m) => m.id === selectedMachineId)
    useEffect(() => {
        if (!selectedMachine) return
        if (selectedMachine.code === "PST-001" || selectedMachine.code === "CLD-003") {
            setActiveTab("temperature")
        } else if (selectedMachine.code === "FLL-002") {
            setActiveTab("vibration")
        } else if (selectedMachine.code === "CNV-001") {
            setActiveTab("rpm")
        } else if (selectedMachine.code === "BLR-001") {
            setActiveTab("temperature")
        } else {
            setActiveTab("efficiency")
        }
    }, [selectedMachineId, selectedMachine])

    // Render machine icon based on its code
    const getMachineIcon = (code: string, active: boolean) => {
        const colorClass = active ? "text-green-600" : "text-gray-400"
        switch (code) {
            case "PST-001":
                return <Thermometer className={`h-5 w-5 ${colorClass}`} />
            case "FLL-002":
                return <Zap className={`h-5 w-5 ${colorClass}`} />
            case "CNV-001":
                return <RefreshCw className={`h-5 w-5 ${colorClass}`} />
            case "CLD-003":
                return <Snowflake className={`h-5 w-5 ${colorClass}`} />
            case "BLR-001":
                return <Flame className={`h-5 w-5 ${colorClass}`} />
            default:
                return <Activity className={`h-5 w-5 ${colorClass}`} />
        }
    }

    // Helpers to define limits for reference lines and colors
    const getThresholdConfig = (code: string, tab: string) => {
        switch (code) {
            case "PST-001":
                if (tab === "temperature") return { min: 72.0, max: 75.0, label: "Normal: 72-75°C" }
                break
            case "FLL-002":
                if (tab === "vibration") return { max: 2.5, label: "Normal: < 2.5Hz" }
                break
            case "CNV-001":
                if (tab === "rpm") return { min: 800, max: 1200, label: "Normal: 800-1200 RPM" }
                if (tab === "pressure") return { min: 1.5, max: 4.0, label: "Normal: 1.5-4.0 Bar" }
                break
            case "CLD-003":
                if (tab === "temperature") return { min: 2.0, max: 4.0, label: "Normal: 2-4°C" }
                break
            case "BLR-001":
                if (tab === "temperature") return { min: 90.0, max: 110.0, label: "Normal: 90-110°C" }
                if (tab === "pressure") return { min: 2.0, max: 6.0, label: "Normal: 2.0-6.0 Bar" }
                break
        }
        if (tab === "efficiency") return { min: 80.0, label: "Normal: >= 80%" }
        return null
    }

    // Format chart date label
    const formatChartTime = (timeStr: string) => {
        const date = new Date(timeStr)
        return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    }

    // Get color code based on severity
    const getSeverityBadge = (severity: string) => {
        switch (severity) {
            case "CRITICAL":
                return <Badge className="bg-red-100 text-red-800 border-red-200">Critical (Score 90)</Badge>
            case "HIGH":
                return <Badge className="bg-orange-100 text-orange-800 border-orange-200">High (Score 60)</Badge>
            case "MEDIUM":
                return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Medium (Score 30)</Badge>
            case "LOW":
                return <Badge className="bg-cyan-100 text-cyan-800 border-cyan-200">Low (Score 10)</Badge>
            default:
                return <Badge variant="secondary">{severity}</Badge>
        }
    }

    // Get risk level label and color
    const getRiskBadge = (score: number) => {
        if (score >= 81) return <span className="text-red-600 font-extrabold flex items-center gap-1">🔴 {score} (Critical Risk)</span>
        if (score >= 61) return <span className="text-orange-500 font-bold flex items-center gap-1">🟠 {score} (High Risk)</span>
        if (score >= 31) return <span className="text-yellow-600 font-bold flex items-center gap-1">🟡 {score} (Warning)</span>
        return <span className="text-green-600 font-semibold flex items-center gap-1">🟢 {score} (Normal)</span>
    }

    // Latest reading shortcut values
    const latestReading = telemetryHistory[telemetryHistory.length - 1]

    if (loading) {
        return (
            <div className="flex h-[80vh] w-full items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto"></div>
                    <p className="mt-4 text-gray-600 font-medium">Memuat data simulasi...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-1">
            {/* Header section with modern background */}
            <div className="relative rounded-2xl bg-gradient-to-r from-green-800 to-green-900 text-white p-6 md:p-8 shadow-md overflow-hidden">
                <div className="absolute right-0 top-0 opacity-10 transform translate-x-12 -translate-y-12">
                    <Activity className="h-96 w-96" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 text-green-200 text-xs font-semibold uppercase tracking-wider mb-2">
                        <Activity className="h-4 w-4 animate-pulse text-green-400" />
                        Live Operations Console
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">IoT Sensor Simulation</h1>
                    <p className="text-green-100 max-w-2xl mt-2 text-sm md:text-base">
                        Simulasikan parameter operasional secara langsung. Nyalakan/matikan mesin virtual untuk menguji respon sistem deteksi anomali otomatis dan eskalasi tingkat risiko.
                    </p>
                    <div className="flex flex-wrap gap-4 mt-6">
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl text-xs md:text-sm border border-white/5 font-semibold">
                            Role Saat Ini: 
                            <span className="font-extrabold text-green-300 flex items-center gap-1 ml-1">
                                {userRole === "SUPERVISOR" ? (
                                    <>
                                        <Unlock className="h-3 w-3 inline" /> SUPERVISOR (Kontrol Penuh)
                                    </>
                                ) : (
                                    <>
                                        <Lock className="h-3 w-3 inline" /> OPERATOR (Hanya Baca)
                                    </>
                                )}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl text-xs md:text-sm border border-white/5 font-semibold">
                            Total Mesin Aktif:
                            <span className="font-extrabold text-green-300 ml-1">
                                {machines.filter(m => m.status === "ACTIVE").length} / {machines.length}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main two-column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column: Machine Switcher list */}
                <div className="space-y-4 lg:col-span-1">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 px-1">
                        Daftar Mesin Virtual
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-medium">5 Unit</span>
                    </h2>
                    
                    <div className="space-y-3">
                        {machines.map((m) => {
                            const isSelected = selectedMachineId === m.id
                            const isActive = m.status === "ACTIVE"
                            return (
                                <div
                                    key={m.id}
                                    onClick={() => setSelectedMachineId(m.id)}
                                    className={`group relative rounded-xl border p-4 transition-all duration-200 cursor-pointer ${
                                        isSelected
                                            ? "bg-white border-green-600 shadow-md ring-2 ring-green-600/10"
                                            : "bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 shadow-sm"
                                    }`}
                                >
                                    {/* Selected Indicator left border bar */}
                                    {isSelected && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-600 rounded-l-xl"></div>
                                    )}

                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2.5 rounded-xl transition-colors ${
                                                isActive ? "bg-green-50" : "bg-gray-100"
                                            }`}>
                                                {getMachineIcon(m.code, isActive)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-sm group-hover:text-green-700 transition-colors">
                                                    {m.name}
                                                </h3>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                                        {m.code}
                                                    </span>
                                                    <span className="text-xs text-gray-400">•</span>
                                                    <span className="text-xs text-gray-500">
                                                        {m.location || "Area A"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* ON/OFF Switch */}
                                        <div className="flex flex-col items-end gap-1" onClick={(e) => e.stopPropagation()}>
                                            <label className="relative inline-flex items-center cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    checked={isActive}
                                                    onChange={() => handleToggleStatus(m.id, m.status)}
                                                    className="sr-only peer"
                                                    disabled={userRole !== "SUPERVISOR"}
                                                />
                                                <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600 ${
                                                    userRole !== "SUPERVISOR" ? "opacity-50 cursor-not-allowed" : ""
                                                }`}></div>
                                            </label>
                                            <span className={`text-[10px] font-extrabold uppercase tracking-wide ${
                                                isActive ? "text-green-600" : "text-gray-400"
                                            }`}>
                                                {isActive ? "ACTIVE" : "INACTIVE"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Inline Telemetry Preview */}
                                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                                        <span>Preview Nilai:</span>
                                        {isActive ? (
                                            <span className="font-semibold text-gray-800 flex gap-2">
                                                {m.code === "PST-001" && latestReading?.temperature && (
                                                    <span>Temp: {latestReading.temperature.toFixed(1)}°C</span>
                                                )}
                                                {m.code === "FLL-002" && latestReading?.vibration && (
                                                    <span>Getaran: {latestReading.vibration.toFixed(2)}Hz</span>
                                                )}
                                                {m.code === "CNV-001" && latestReading?.rpm && latestReading?.pressure && (
                                                    <>
                                                        <span>RPM: {latestReading.rpm}</span>
                                                        <span>Pres: {latestReading.pressure.toFixed(1)}B</span>
                                                    </>
                                                )}
                                                {m.code === "CLD-003" && latestReading?.temperature && (
                                                    <span>Temp: {latestReading.temperature.toFixed(1)}°C</span>
                                                )}
                                                {m.code === "BLR-001" && latestReading?.temperature && latestReading?.pressure && (
                                                    <>
                                                        <span>Temp: {latestReading.temperature.toFixed(1)}°C</span>
                                                        <span>Pres: {latestReading.pressure.toFixed(1)}B</span>
                                                    </>
                                                )}
                                                {latestReading?.efficiency && (
                                                    <span className="text-green-700">Eff: {latestReading.efficiency.toFixed(0)}%</span>
                                                )}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 italic">Mesin Offline</span>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Right Column: Interactive Charts and Telemetry Data */}
                <div className="space-y-6 lg:col-span-2">
                    {selectedMachine ? (
                        <>
                            {/* Selected Machine Header Card */}
                            <Card className="shadow-sm border-gray-200">
                                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 gap-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <CardTitle className="text-xl font-extrabold text-gray-900">
                                                {selectedMachine.name}
                                            </CardTitle>
                                            <Badge variant={selectedMachine.status === "ACTIVE" ? "success" : "warning"}>
                                                {selectedMachine.status}
                                            </Badge>
                                        </div>
                                        <CardDescription className="mt-1">
                                            Tipe: <span className="font-semibold text-gray-700">{selectedMachine.type}</span> | Area: <span className="font-semibold text-gray-700">{selectedMachine.location || "Area A"}</span>
                                        </CardDescription>
                                    </div>
                                    <div className="text-xs text-gray-500 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                                        <Info className="h-4 w-4 text-green-700 inline mr-1" />
                                        Menerima log baru setiap 15 detik secara background.
                                    </div>
                                </CardHeader>
                                
                                <CardContent>
                                    {selectedMachine.status !== "ACTIVE" ? (
                                        <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-gray-50 border border-dashed border-gray-200 rounded-xl">
                                            <XCircle className="h-10 w-10 text-gray-400" />
                                            <h3 className="mt-3 font-bold text-gray-800">Mesin Dinonaktifkan</h3>
                                            <p className="text-sm text-gray-500 max-w-sm mt-1">
                                                Mesin ini dalam keadaan mati. Hubungkan daya menggunakan switch di panel kiri untuk mensimulasikan pembacaan telemetry.
                                            </p>
                                            {userRole === "SUPERVISOR" ? (
                                                <Button
                                                    onClick={() => handleToggleStatus(selectedMachine.id, "INACTIVE")}
                                                    className="mt-4 bg-green-700 hover:bg-green-800 text-xs font-semibold h-9"
                                                >
                                                    Nyalakan Daya Sekarang
                                                </Button>
                                            ) : (
                                                <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-400 bg-gray-100/50 px-3 py-1.5 rounded-lg">
                                                    <Lock className="h-3.5 w-3.5" /> Butuh Supervisor Role untuk menyalakan daya
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            {/* Telemetry Numeric Cards */}
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                                                {/* Card for Temperature */}
                                                {(selectedMachine.code === "PST-001" ||
                                                    selectedMachine.code === "CLD-003" ||
                                                    selectedMachine.code === "BLR-001") && (
                                                    <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200/60 shadow-sm relative overflow-hidden">
                                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block">Temperatur</span>
                                                        <span className="text-2xl font-extrabold text-gray-900 mt-1 block">
                                                            {latestReading?.temperature ? `${latestReading.temperature.toFixed(1)}°C` : "N/A"}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 mt-1 block font-medium">
                                                            Normal: {selectedMachine.code === "PST-001" ? "72-75°C" : selectedMachine.code === "CLD-003" ? "2-4°C" : "90-110°C"}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Card for Vibration */}
                                                {selectedMachine.code === "FLL-002" && (
                                                    <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200/60 shadow-sm relative overflow-hidden">
                                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block">Getaran</span>
                                                        <span className="text-2xl font-extrabold text-gray-900 mt-1 block">
                                                            {latestReading?.vibration ? `${latestReading.vibration.toFixed(2)} Hz` : "N/A"}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 mt-1 block font-medium">
                                                            Normal: &lt; 2.5Hz
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Card for Pressure */}
                                                {(selectedMachine.code === "CNV-001" || selectedMachine.code === "BLR-001") && (
                                                    <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200/60 shadow-sm relative overflow-hidden">
                                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block">Tekanan</span>
                                                        <span className="text-2xl font-extrabold text-gray-900 mt-1 block">
                                                            {latestReading?.pressure ? `${latestReading.pressure.toFixed(2)} Bar` : "N/A"}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 mt-1 block font-medium">
                                                            Normal: {selectedMachine.code === "CNV-001" ? "1.5-4.0 Bar" : "2.0-6.0 Bar"}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Card for RPM */}
                                                {selectedMachine.code === "CNV-001" && (
                                                    <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200/60 shadow-sm relative overflow-hidden">
                                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block">RPM</span>
                                                        <span className="text-2xl font-extrabold text-gray-900 mt-1 block">
                                                            {latestReading?.rpm ? `${latestReading.rpm}` : "N/A"}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 mt-1 block font-medium">
                                                            Normal: 800-1200
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Card for Efficiency */}
                                                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200/60 shadow-sm relative overflow-hidden">
                                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block">Efisiensi</span>
                                                    <span className={`text-2xl font-extrabold mt-1 block ${
                                                        latestReading?.efficiency && latestReading.efficiency < 80 ? "text-amber-600" : "text-gray-900"
                                                    }`}>
                                                        {latestReading?.efficiency ? `${latestReading.efficiency.toFixed(0)}%` : "N/A"}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 mt-1 block font-medium">
                                                        Normal: &gt;= 80%
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Graph Section */}
                                            <div className="border border-gray-100 rounded-2xl p-4 bg-white shadow-sm mb-6">
                                                {/* Chart Tabs */}
                                                <div className="flex flex-wrap items-center gap-1.5 mb-4 border-b border-gray-100 pb-3">
                                                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider mr-2">Telemetry Parameter:</span>
                                                    {(selectedMachine.code === "PST-001" ||
                                                        selectedMachine.code === "CLD-003" ||
                                                        selectedMachine.code === "BLR-001") && (
                                                        <button
                                                            onClick={() => setActiveTab("temperature")}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                                                activeTab === "temperature"
                                                                    ? "bg-green-600 text-white shadow-sm"
                                                                    : "text-gray-600 hover:bg-gray-50"
                                                            }`}
                                                        >
                                                            Temperatur (°C)
                                                        </button>
                                                    )}
                                                    {selectedMachine.code === "FLL-002" && (
                                                        <button
                                                            onClick={() => setActiveTab("vibration")}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                                                activeTab === "vibration"
                                                                    ? "bg-green-600 text-white shadow-sm"
                                                                    : "text-gray-600 hover:bg-gray-50"
                                                            }`}
                                                        >
                                                            Getaran (Hz)
                                                        </button>
                                                    )}
                                                    {(selectedMachine.code === "CNV-001" || selectedMachine.code === "BLR-001") && (
                                                        <button
                                                            onClick={() => setActiveTab("pressure")}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                                                activeTab === "pressure"
                                                                    ? "bg-green-600 text-white shadow-sm"
                                                                    : "text-gray-600 hover:bg-gray-50"
                                                            }`}
                                                        >
                                                            Tekanan (Bar)
                                                        </button>
                                                    )}
                                                    {selectedMachine.code === "CNV-001" && (
                                                        <button
                                                            onClick={() => setActiveTab("rpm")}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                                                activeTab === "rpm"
                                                                    ? "bg-green-600 text-white shadow-sm"
                                                                    : "text-gray-600 hover:bg-gray-50"
                                                            }`}
                                                        >
                                                            RPM
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => setActiveTab("efficiency")}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                                            activeTab === "efficiency"
                                                                ? "bg-green-600 text-white shadow-sm"
                                                                : "text-gray-600 hover:bg-gray-50"
                                                        }`}
                                                    >
                                                        Efisiensi (%)
                                                    </button>
                                                </div>

                                                {/* Render Recharts line chart */}
                                                {isMounted && telemetryHistory.length > 0 ? (
                                                    <div className="h-72 w-full text-xs font-semibold">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <LineChart
                                                                data={telemetryHistory}
                                                                margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                                                            >
                                                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                                                <XAxis
                                                                    dataKey="read_at"
                                                                    tickFormatter={formatChartTime}
                                                                    stroke="#94a3b8"
                                                                />
                                                                <YAxis stroke="#94a3b8" />
                                                                <ChartTooltip
                                                                    labelClassName="text-slate-900 font-bold"
                                                                    labelFormatter={(label) => new Date(label).toLocaleString("id-ID")}
                                                                    formatter={(value: any, name: string) => {
                                                                        const formattedName = name.charAt(0).toUpperCase() + name.slice(1)
                                                                        return [value, formattedName]
                                                                    }}
                                                                />
                                                                <Legend />
                                                                
                                                                {/* Reference normal threshold bounds */}
                                                                {(() => {
                                                                    const config = getThresholdConfig(selectedMachine.code, activeTab)
                                                                    if (!config) return null
                                                                    return (
                                                                        <>
                                                                            {config.min !== undefined && (
                                                                                <ReferenceLine
                                                                                    y={config.min}
                                                                                    stroke="#f59e0b"
                                                                                    strokeDasharray="4 4"
                                                                                    label={{ value: `Lower Limit (${config.min})`, position: "insideBottomLeft", fill: "#f59e0b", fontSize: 10 }}
                                                                                />
                                                                            )}
                                                                            {config.max !== undefined && (
                                                                                <ReferenceLine
                                                                                    y={config.max}
                                                                                    stroke="#ef4444"
                                                                                    strokeDasharray="4 4"
                                                                                    label={{ value: `Upper Limit (${config.max})`, position: "insideTopLeft", fill: "#ef4444", fontSize: 10 }}
                                                                                />
                                                                            )}
                                                                        </>
                                                                    )
                                                                })()}

                                                                {/* Telemetry Line */}
                                                                <Line
                                                                    type="monotone"
                                                                    dataKey={activeTab}
                                                                    name={activeTab === "efficiency" ? "Efisiensi (%)" : activeTab === "temperature" ? "Temperatur (°C)" : activeTab === "vibration" ? "Getaran (Hz)" : activeTab === "pressure" ? "Tekanan (Bar)" : "RPM"}
                                                                    stroke={activeTab === "efficiency" ? "#10b981" : "#0284c7"}
                                                                    strokeWidth={2.5}
                                                                    activeDot={{ r: 6 }}
                                                                    dot={(props: any) => {
                                                                        const { cx, cy, payload } = props
                                                                        // If this reading was marked as an anomaly by the backend, draw a distinct pulsing red circle
                                                                        if (payload.is_anomaly) {
                                                                            return (
                                                                                <circle cx={cx} cy={cy} r={5} fill="#ef4444" stroke="#ffffff" strokeWidth={2} key={payload.id} />
                                                                            )
                                                                        }
                                                                        return (
                                                                            <circle cx={cx} cy={cy} r={2.5} fill={activeTab === "efficiency" ? "#10b981" : "#0284c7"} stroke="none" key={payload.id} />
                                                                        )
                                                                    }}
                                                                />
                                                            </LineChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                ) : (
                                                    <div className="flex h-72 items-center justify-center text-gray-400 text-sm">
                                                        <Activity className="h-6 w-6 text-gray-300 animate-pulse mr-2" />
                                                        Mengumpulkan data pembacaan pertama...
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Active Incidents / Anomalies Panel */}
                            <Card className="shadow-sm border-gray-200">
                                <CardHeader className="pb-3 border-b border-gray-100 flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                                            <ShieldAlert className="h-5 w-5 text-red-600" />
                                            Log Anomali & Insiden Aktif
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            Eskalasi risk score dihitung otomatis berdasarkan modifikator status, wilayah, dan riwayat.
                                        </CardDescription>
                                    </div>
                                </CardHeader>
                                
                                <CardContent className="pt-4">
                                    {incidents.length === 0 ? (
                                        <div className="text-center py-6 text-gray-400 text-sm flex items-center justify-center gap-2">
                                            <CheckCircle className="h-5 w-5 text-green-500" />
                                            Tidak ada insiden aktif. Mesin berjalan dengan stabil.
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto pr-1">
                                            {incidents.map((incident) => {
                                                const isOpen = incident.status === "OPEN"
                                                const isInProgress = incident.status === "IN_PROGRESS"
                                                
                                                return (
                                                    <div key={incident.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                                        <div className="space-y-1 bg-white">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className="font-extrabold text-sm text-gray-900">
                                                                    {incident.title}
                                                                </span>
                                                                {getSeverityBadge(incident.severity)}
                                                                
                                                                {/* Status badge */}
                                                                <Badge variant={
                                                                    incident.status === "RESOLVED" ? "success" : 
                                                                    incident.status === "IN_PROGRESS" ? "warning" : "destructive"
                                                                }>
                                                                    {incident.status === "OPEN" ? "OPEN" : incident.status === "IN_PROGRESS" ? "IN PROGRESS" : "RESOLVED"}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-xs text-gray-600 whitespace-pre-line bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                                                                {incident.description || "Tidak ada deskripsi detail."}
                                                            </p>
                                                            <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-400 pt-1">
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="h-3.5 w-3.5 text-gray-300" />
                                                                    {new Date(incident.created_at).toLocaleString("id-ID")}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    Risk Score: {getRiskBadge(incident.risk_score)}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Action Buttons: Acknowledge & Resolve */}
                                                        {incident.status !== "RESOLVED" && (
                                                            <div className="flex sm:flex-col gap-2 shrink-0 pt-1">
                                                                {isOpen && (
                                                                    <Button
                                                                        onClick={() => handleAcknowledge(incident.id)}
                                                                        className="bg-yellow-600 hover:bg-yellow-700 text-[11px] h-8 font-semibold"
                                                                    >
                                                                        Acknowledge
                                                                    </Button>
                                                                )}
                                                                {(isOpen || isInProgress) && (
                                                                    <Button
                                                                        onClick={() => handleResolve(incident.id)}
                                                                        className="bg-green-700 hover:bg-green-800 text-[11px] h-8 font-semibold"
                                                                    >
                                                                        Resolve
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <div className="flex h-full w-full items-center justify-center p-12 bg-white rounded-xl border border-gray-200 text-center">
                            <div>
                                <AlertTriangle className="h-10 w-10 text-gray-300 mx-auto" />
                                <h3 className="mt-3 font-bold text-gray-800">Silakan Pilih Mesin</h3>
                                <p className="text-sm text-gray-500 max-w-sm mt-1">
                                    Pilih salah satu mesin dari daftar di sebelah kiri untuk melihat visualisasi grafik telemetry real-time dan log insiden.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
