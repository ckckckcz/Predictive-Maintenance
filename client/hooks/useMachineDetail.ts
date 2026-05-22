"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import toast from "react-hot-toast"
import { Machine, SensorReading, Incident } from "@/types/machine"

export function useMachineDetail(machineId: string, onIncidentUpdate?: () => void) {
    const [machine, setMachine] = useState<Machine | null>(null)
    const [history, setHistory] = useState<SensorReading[]>([])
    const [incidents, setIncidents] = useState<Incident[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<string>("efficiency")
    const [userRole, setUserRole] = useState<string | null>(null)
    const [timeFrame, setTimeFrame] = useState<"realtime" | "hourly">("hourly")
 
    const loadData = async () => {
        try {
            const [mDetails, mHistory, mIncidents] = await Promise.all([
                api.get<any, Machine>(`/api/v1/machines/${machineId}`),
                api.get<any, SensorReading[]>(`/api/v1/machines/${machineId}/sensors/history?limit=300`),
                api.get<any, Incident[]>(`/api/v1/incidents?machine_id=${machineId}&limit=100`)
            ])
            setMachine(mDetails)
            const sorted = (mHistory || []).sort(
                (a, b) => new Date(a.read_at).getTime() - new Date(b.read_at).getTime()
            )
            setHistory(sorted)
            setIncidents(mIncidents || [])
            if (mDetails && !machine) {
                const tabMap: Record<string, string> = {
                    "PST-001": "temperature", "CLD-003": "temperature",
                    "FLL-002": "vibration", "CNV-001": "rpm", "BLR-001": "pressure"
                }
                setActiveTab(tabMap[mDetails.code] || "efficiency")
            }
        } catch (err: any) {
            toast.error("Gagal memuat detail mesin: " + err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleAcknowledge = async (incidentId: string) => {
        const toastId = toast.loading("Mengakui insiden...")
        try {
            await api.post(`/api/v1/incidents/${incidentId}/acknowledge`)
            toast.success("Insiden diakui, status: IN_PROGRESS", { id: toastId })
            await loadData()
            onIncidentUpdate?.()
        } catch (err: any) {
            toast.error(`Gagal mengakui insiden: ${err.message}`, { id: toastId })
        }
    }

    const handleResolve = async (incidentId: string) => {
        const toastId = toast.loading("Menyelesaikan insiden...")
        try {
            await api.post(`/api/v1/incidents/${incidentId}/resolve`)
            toast.success("Insiden diselesaikan, status: RESOLVED", { id: toastId })
            await loadData()
            onIncidentUpdate?.()
        } catch (err: any) {
            toast.error(`Gagal menyelesaikan insiden: ${err.message}`, { id: toastId })
        }
    }

    useEffect(() => {
        if (typeof window !== "undefined") {
            const userStr = localStorage.getItem("user")
            if (userStr) {
                try { setUserRole(JSON.parse(userStr).role) } catch { }
            }
        }
        loadData()
        const interval = setInterval(loadData, 5000)
        return () => clearInterval(interval)
    }, [machineId])

    return {
        machine, history, incidents, loading,
        activeTab, setActiveTab, userRole,
        handleAcknowledge, handleResolve,
        activeIncidents: incidents.filter(i => i.status === "OPEN" || i.status === "IN_PROGRESS"),
        latestReading: history.length > 0 ? history[history.length - 1] : null,
        timeFrame, setTimeFrame,
        refresh: loadData,
    }
}
