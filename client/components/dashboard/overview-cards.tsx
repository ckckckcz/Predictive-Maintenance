"use client"

import { useState, useEffect } from "react"
import {
    Activity,
    AlertTriangle,
    CheckCircle,
    Clock,
    TrendingUp,
    TrendingDown,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"

interface Machine {
    id: string
    name: string
    code: string
    type: string
    location: string | null
    status: "ACTIVE" | "INACTIVE" | "MAINTENANCE"
    created_at: string
}

interface IncidentStats {
    total: number
    open: number
    in_progress: number
    resolved: number
    critical: number
    high: number
    medium: number
    low: number
}

interface Incident {
    id: string
    machine_id: string
    title: string
    severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
    status: "OPEN" | "IN_PROGRESS" | "RESOLVED"
}

export function OverviewCards() {
    const [machines, setMachines] = useState<Machine[]>([])
    const [statsData, setStatsData] = useState<IncidentStats | null>(null)
    const [incidents, setIncidents] = useState<Incident[]>([])
    const [loading, setLoading] = useState(true)

    const fetchData = async () => {
        try {
            const [mList, sData, iList] = await Promise.all([
                api.get<any, Machine[]>("/api/v1/machines"),
                api.get<any, IncidentStats>("/api/v1/incidents/stats"),
                api.get<any, Incident[]>("/api/v1/incidents?limit=100")
            ])
            setMachines(mList || [])
            setStatsData(sData || null)
            setIncidents(iList || [])
        } catch (err) {
            console.error("Gagal memuat statistik dashboard:", err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchData, 5000)
        return () => clearInterval(interval)
    }, [])

    const activeMachinesCount = machines.filter(m => m.status === "ACTIVE").length
    const inactiveMachinesCount = machines.filter(m => m.status === "INACTIVE").length
    
    // Health Score logic: Percentage of active machines without any critical/high incidents
    const activeIncidents = incidents.filter(
        inc => inc.status === "OPEN" || inc.status === "IN_PROGRESS"
    )
    const badMachineIds = new Set(
        activeIncidents
            .filter(inc => inc.severity === "CRITICAL" || inc.severity === "HIGH")
            .map(inc => inc.machine_id)
    )
    const activeMachines = machines.filter(m => m.status === "ACTIVE")
    const stableActiveMachines = activeMachines.filter(m => !badMachineIds.has(m.id))
    const healthScore = activeMachines.length > 0
        ? Math.round((stableActiveMachines.length / activeMachines.length) * 100)
        : 100

    const stats = [
        {
            title: "Total Mesin",
            value: loading ? "..." : `${machines.length}`,
            indicator: loading ? "Loading..." : `${activeMachinesCount} Aktif`,
            positive: activeMachinesCount > 0,
            icon: Activity,
            color: "text-emerald-500",
            bgColor: "bg-emerald-500/10",
            borderColor: "border-emerald-500/10",
        },
        {
            title: "Maintenance Aktif",
            value: loading ? "..." : `${statsData?.in_progress || 0}`,
            indicator: loading ? "Loading..." : `${statsData?.resolved || 0} Selesai`,
            positive: true,
            icon: Clock,
            color: "text-amber-500",
            bgColor: "bg-amber-500/10",
            borderColor: "border-amber-500/10",
        },
        {
            title: "Issue Terdeteksi",
            value: loading ? "..." : `${statsData?.open || 0}`,
            indicator: loading ? "Loading..." : `${statsData?.critical || 0} Kritis`,
            positive: (statsData?.open || 0) === 0,
            icon: AlertTriangle,
            color: "text-rose-500",
            bgColor: "bg-rose-500/10",
            borderColor: "border-rose-500/10",
        },
        {
            title: "Health Score",
            value: loading ? "..." : `${healthScore}%`,
            indicator: loading ? "Loading..." : `Dari ${activeMachines.length} Mesin Aktif`,
            positive: healthScore >= 80,
            icon: CheckCircle,
            color: "text-blue-500",
            bgColor: "bg-blue-500/10",
            borderColor: "border-blue-500/10",
        },
    ]

    return (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
                <Card
                    key={index}
                    className={cn(
                        "overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border bg-white/70 backdrop-blur-md",
                        stat.borderColor
                    )}
                >
                    <CardContent className="px-6 py-4">
                        <div className="flex items-center justify-between space-y-0 pb-2">
                            <p className="text-sm font-semibold text-gray-500">
                                {stat.title}
                            </p>

                            <div className={cn("p-2.5 rounded-xl transition-all duration-300", stat.bgColor)}>
                                <stat.icon
                                    className={cn("h-5 w-5 animate-pulse", stat.color)}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1 mt-2">
                            <h3 className="text-3xl font-extrabold tracking-tight text-gray-800 mb-1">
                                {stat.value}
                            </h3>

                            <div className="flex items-center text-xs text-gray-500 font-medium">
                                <span
                                    className={cn(
                                        "flex items-center font-bold px-2 py-0.5 rounded-full mr-2",
                                        stat.positive
                                            ? "bg-emerald-100 text-emerald-700"
                                            : "bg-rose-100 text-rose-700"
                                    )}
                                >
                                    {stat.positive ? (
                                        <TrendingUp className="h-3 w-3 mr-0.5" />
                                    ) : (
                                        <TrendingDown className="h-3 w-3 mr-0.5" />
                                    )}

                                    {stat.indicator}
                                </span>
                                <span className="text-gray-400">real-time</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}