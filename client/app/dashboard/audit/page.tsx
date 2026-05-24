"use client"

import { useState, useEffect } from "react"
import { RefreshCw, Terminal, ShieldAlert, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import toast from "react-hot-toast"

import { useUserRole } from "@/hooks/useUserRole"
import { auditService } from "@/services/auditService"
import { AuditLog, IncidentReply, IncidentWithDetails } from "@/types/audit"
import { AuditLogsTab } from "@/components/dashboard/audit/AuditLogsTab"
import { OperatorReportsTab } from "@/components/dashboard/audit/OperatorReportsTab"
import { IncidentReplyModal } from "@/components/dashboard/audit/IncidentReplyModal"

export default function AuditLogPage() {
    const [activeTab, setActiveTab] = useState<"logs" | "incidents">("logs")
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const { userRole, currentUserId, isSupervisor } = useUserRole()

    // Incidents Tab states
    const [incidents, setIncidents] = useState<IncidentWithDetails[]>([])
    const [incidentsLoading, setIncidentsLoading] = useState(false)

    // Reply modal states
    const [selectedIncident, setSelectedIncident] = useState<IncidentWithDetails | null>(null)
    const [replies, setReplies] = useState<IncidentReply[]>([])
    const [repliesLoading, setRepliesLoading] = useState(false)

    const loadAuditLogs = async () => {
        try {
            const data = await auditService.getAuditLogs()
            setLogs(data || [])
        } catch (err: any) {
            console.error("Gagal memuat log audit:", err)
            if (err.status !== 403 && err.message?.indexOf("403") === -1) {
                toast.error("Gagal memuat log audit: " + err.message)
            }
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const loadIncidents = async () => {
        setIncidentsLoading(true)
        try {
            const data = await auditService.getIncidents({ limit: 100 })
            setIncidents(data || [])
        } catch (err: any) {
            console.error("Gagal memuat insiden:", err)
            toast.error("Gagal memuat daftar laporan insiden: " + err.message)
        } finally {
            setIncidentsLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        if (userRole === "SUPERVISOR") {
            if (activeTab === "logs") {
                loadAuditLogs()
            } else {
                loadIncidents()
            }
        } else if (userRole !== null) {
            if (activeTab === "incidents") {
                loadIncidents()
            } else {
                setLoading(false)
            }
        }
    }, [userRole, activeTab])

    const handleRefresh = () => {
        setRefreshing(true)
        if (activeTab === "logs") {
            loadAuditLogs()
        } else {
            loadIncidents()
        }
    }

    const handleOpenIncident = async (incident: IncidentWithDetails) => {
        setSelectedIncident(incident)
        setReplies([])
        setRepliesLoading(true)
        try {
            const data = await auditService.getReplies(incident.id)
            setReplies(data || [])
        } catch (err: any) {
            console.error("Gagal memuat balasan:", err)
            toast.error("Gagal memuat riwayat balasan: " + err.message)
        } finally {
            setRepliesLoading(false)
        }
    }

    const handleSendReply = async (message: string, status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | null) => {
        if (!selectedIncident) return

        const toastId = toast.loading("Mengirim balasan...")
        try {
            const reqData: any = {
                message: message.trim() || `Memperbarui status laporan menjadi ${status}`,
            }
            if (status) {
                reqData.status = status
            }

            const newReply = await auditService.sendReply(selectedIncident.id, reqData)

            setReplies((prev) => [...prev, newReply])
            
            if (status) {
                setSelectedIncident((prev) => (prev ? { ...prev, status } : null))
                loadIncidents()
            }

            toast.success("Balasan berhasil dikirim!", { id: toastId })
        } catch (err: any) {
            console.error("Gagal mengirim balasan:", err)
            toast.error("Gagal mengirim balasan: " + err.message, { id: toastId })
        }
    }

    const openIncidentsCount = incidents.filter(i => i.status !== "RESOLVED").length

    if (userRole !== null && !isSupervisor && activeTab === "logs") {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4 bg-white/70 backdrop-blur-md rounded-2xl border border-gray-200 shadow-md max-w-2xl mx-auto mt-10">
                <div className="h-16 w-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-5 border border-amber-200">
                    <Lock className="h-8 w-8 text-amber-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Akses Halaman Terbatas</h2>
                <p className="text-gray-500 text-center text-sm max-w-md mb-6">
                    Maaf, halaman Log Audit Sistem hanya dapat diakses oleh pengguna dengan hak akses <span className="font-bold text-amber-700">SUPERVISOR</span>. Anda dapat beralih ke Respon Laporan Operator.
                </p>
                <div className="flex gap-4">
                    <Button onClick={() => setActiveTab("incidents")} className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold h-11 px-6 rounded-xl cursor-pointer">
                        Buka Respon Laporan
                    </Button>
                    <Link href="/dashboard">
                        <Button variant="outline" className="h-11 px-6 rounded-xl cursor-pointer">
                            Kembali ke Dashboard
                        </Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                        Home <span className="text-gray-300">/</span> <span className="text-gray-900 font-medium">Audit & Laporan</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                        {activeTab === "logs" ? "Log Jurnal Sistem" : "Respon Laporan Operator"}
                    </h1>
                    <p className="text-gray-500 text-sm">
                        {activeTab === "logs" 
                            ? "Jurnal audit komprehensif atas seluruh tindakan pengguna dan deteksi anomali sistem." 
                            : "Daftar pengaduan insiden dari lapangan. Berikan instruksi langsung dan ubah status laporan."}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleRefresh} disabled={refreshing || loading || incidentsLoading} className="h-11 border-gray-200 hover:bg-gray-50 bg-white">
                        <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
                        Refresh Data
                    </Button>
                </div>
            </div>

            <div className="flex border-b border-gray-200">
                {isSupervisor && (
                    <button onClick={() => setActiveTab("logs")} className={cn("flex items-center gap-2 px-6 py-3 border-b-2 font-semibold text-sm transition-colors cursor-pointer", activeTab === "logs" ? "border-emerald-600 text-emerald-700 bg-emerald-50/30" : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50/50")}>
                        <Terminal className="h-4 w-4" /> Log Jurnal Sistem
                    </button>
                )}
                <button onClick={() => setActiveTab("incidents")} className={cn("flex items-center gap-2 px-6 py-3 border-b-2 font-semibold text-sm transition-colors cursor-pointer relative", activeTab === "incidents" ? "border-emerald-600 text-emerald-700 bg-emerald-50/30" : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50/50")}>
                    <ShieldAlert className="h-4 w-4" /> Respon Laporan Operator
                    {openIncidentsCount > 0 && (
                        <span className="absolute top-2 right-2 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                    )}
                </button>
            </div>

            {activeTab === "logs" ? (
                <AuditLogsTab logs={logs} loading={loading} />
            ) : (
                <OperatorReportsTab incidents={incidents} loading={incidentsLoading} onOpenIncident={handleOpenIncident} />
            )}

            <IncidentReplyModal
                incident={selectedIncident}
                onClose={() => setSelectedIncident(null)}
                replies={replies}
                loading={repliesLoading}
                currentUserId={currentUserId}
                onSendReply={handleSendReply}
            />
        </div>
    )
}