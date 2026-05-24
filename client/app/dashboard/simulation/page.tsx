"use client"

import { useState, useEffect } from "react"
import { machineService } from "@/services/machineService"
import toast from "react-hot-toast"
import { Activity, AlertTriangle } from "lucide-react"
import { Machine, SensorReading } from "@/types/machine"
import { useUserRole } from "@/hooks/useUserRole"
import { SimulationMachineItem } from "@/components/dashboard/simulation/SimulationMachineItem"
import { SimulationTelemetryPanel } from "@/components/dashboard/simulation/SimulationTelemetryPanel"

export default function SimulationDashboard() {
    const [machines, setMachines] = useState<Machine[]>([])
    const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null)
    const [telemetryHistory, setTelemetryHistory] = useState<SensorReading[]>([])
    const { userRole, isSupervisor } = useUserRole()
    const [loading, setLoading] = useState(true)
    const [simulating, setSimulating] = useState(false)

    // Initial load
    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true)
            try {
                const machineList = await machineService.getAll()
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

    const fetchMachinesStatus = async () => {
        try {
            const machineList = await machineService.getAll()
            setMachines(machineList || [])
        } catch (err) {
            // Silence background poll errors
        }
    }

    const fetchSelectedMachineData = async (machineId: string) => {
        try {
            const history = await machineService.getSensorHistory(machineId, 30)
            const sortedHistory = (history || []).sort(
                (a, b) => new Date(a.read_at).getTime() - new Date(b.read_at).getTime()
            )
            setTelemetryHistory(sortedHistory)
        } catch (err) {
            // Silence background poll errors
        }
    }

    // Poll data periodically
    useEffect(() => {
        if (!selectedMachineId) return

        fetchSelectedMachineData(selectedMachineId)

        const interval = setInterval(() => {
            fetchMachinesStatus()
            fetchSelectedMachineData(selectedMachineId)
        }, 5000)

        return () => clearInterval(interval)
    }, [selectedMachineId])

    const handleToggleStatus = async (machineId: string, currentStatus: string) => {
        if (!isSupervisor) {
            toast.error("Akses Ditolak: Anda membutuhkan peran SUPERVISOR untuk mengontrol status mesin.")
            return
        }

        const targetStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE"
        const toastId = toast.loading(`Mengubah status mesin menjadi ${targetStatus}...`)

        try {
            await machineService.toggleStatus(machineId, targetStatus)
            toast.success(`Mesin berhasil di-${targetStatus === "ACTIVE" ? "hidupkan" : "matikan"}`, { id: toastId })
            fetchMachinesStatus()
        } catch (err: any) {
            toast.error(`Gagal mengubah status: ${err.message}`, { id: toastId })
        }
    }

    const handleSimulateAnomaly = async (machineId: string) => {
        setSimulating(true)
        const toastId = toast.loading("Mensimulasikan anomali sensor...")
        try {
            await machineService.simulateAnomaly(machineId)
            toast.success("Anomali berhasil disimulasikan! Sensor mendeteksi kegagalan.", { id: toastId })
            if (selectedMachineId) fetchSelectedMachineData(selectedMachineId)
        } catch (err: any) {
            toast.error(`Gagal mensimulasikan anomali: ${err.message}`, { id: toastId })
        } finally {
            setSimulating(false)
        }
    }

    const selectedMachine = machines.find((m) => m.id === selectedMachineId)
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
            <div className="relative rounded-2xl bg-gradient-to-r from-green-800 to-green-900 text-white p-6 md:p-8 shadow-md overflow-hidden">
                <div className="absolute right-0 top-0 opacity-10 transform translate-x-12 -translate-y-12">
                    <Activity className="h-96 w-96" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 text-green-200 text-xs font-semibold uppercase tracking-wider mb-2">
                        <Activity className="h-4 w-4 animate-pulse text-green-400" /> Live Operations Console
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">IoT Sensor Simulation</h1>
                    <p className="text-green-100 max-w-2xl mt-2 text-sm md:text-base">
                        Simulasikan parameter operasional secara langsung. Nyalakan/matikan mesin virtual untuk menguji respon sistem deteksi anomali otomatis dan eskalasi tingkat risiko.
                    </p>
                    <div className="flex flex-wrap gap-4 mt-6">
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl text-xs md:text-sm border border-white/5 font-semibold">
                            Role Saat Ini:
                            <span className="font-extrabold text-green-300 ml-1">
                                {isSupervisor ? "SUPERVISOR (Kontrol Penuh)" : "OPERATOR (Hanya Baca)"}
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-4 lg:col-span-1">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 px-1">
                        Daftar Mesin Virtual
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-medium">{machines.length} Unit</span>
                    </h2>

                    <div className="space-y-3">
                        {machines.map((m) => (
                            <SimulationMachineItem
                                key={m.id}
                                m={m}
                                isSelected={selectedMachineId === m.id}
                                isActive={m.status === "ACTIVE"}
                                latestReading={m.id === selectedMachineId ? latestReading : undefined}
                                userRole={userRole}
                                onSelect={() => setSelectedMachineId(m.id)}
                                onToggleStatus={() => handleToggleStatus(m.id, m.status)}
                            />
                        ))}
                    </div>
                </div>

                <div className="space-y-6 lg:col-span-2">
                    {selectedMachine ? (
                        <SimulationTelemetryPanel
                            selectedMachine={selectedMachine}
                            latestReading={latestReading}
                            simulating={simulating}
                            userRole={userRole}
                            onSimulateAnomaly={() => handleSimulateAnomaly(selectedMachine.id)}
                            onToggleStatus={() => handleToggleStatus(selectedMachine.id, selectedMachine.status)}
                        />
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
