"use client"

import { useState, useEffect, useRef } from "react"
import {
    Activity,
    ShieldAlert,
    RefreshCw,
    Search,
    Calendar,
    User,
    Terminal,
    Lock,
    MessageSquare,
    Send,
    AlertCircle,
    CheckCircle2,
    Clock,
    Wrench,
    MessageCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ResponsiveModal } from "@/components/dashboard/responsive-modal"
import { api } from "@/lib/api"
import toast from "react-hot-toast"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface AuditLog {
    id: string
    incident_id: string | null
    user_id: string | null
    action: string
    old_value: string | null
    new_value: string | null
    ip_address: string | null
    created_at: string
    actor_name: string | null
}

interface IncidentReply {
    id: string
    incident_id: string
    user_id: string
    message: string
    created_at: string
    user_name: string
    user_role: string
}

interface IncidentWithDetails {
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
    machine_name: string
    machine_code: string
    acknowledged_by_name: string | null
    resolved_by_name: string | null
}

export default function AuditLogPage() {
    const [activeTab, setActiveTab] = useState<"logs" | "incidents">("logs")
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [loading, setLoading] = useState(true)
    const [userRole, setUserRole] = useState<string | null>(null)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [refreshing, setRefreshing] = useState(false)

    // Incidents Tab states
    const [incidents, setIncidents] = useState<IncidentWithDetails[]>([])
    const [incidentsLoading, setIncidentsLoading] = useState(false)
    const [incidentSearchQuery, setIncidentSearchQuery] = useState("")

    // Reply modal states
    const [selectedIncident, setSelectedIncident] = useState<IncidentWithDetails | null>(null)
    const [replies, setReplies] = useState<IncidentReply[]>([])
    const [repliesLoading, setRepliesLoading] = useState(false)
    const [replyMessage, setReplyMessage] = useState("")
    const [replyStatus, setReplyStatus] = useState<"OPEN" | "IN_PROGRESS" | "RESOLVED" | null>(null)
    const [submittingReply, setSubmittingReply] = useState(false)

    const chatEndRef = useRef<HTMLDivElement>(null)

    // Auto-scroll chat window
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [replies])

    const fetchUserAndRole = () => {
        if (typeof window !== "undefined") {
            const userStr = localStorage.getItem("user")
            if (userStr) {
                try {
                    const user = JSON.parse(userStr)
                    setUserRole(user.role)
                    setCurrentUserId(user.id)
                } catch (e) {
                    console.error("Gagal parse data user:", e)
                }
            }
        }
    }

    const loadAuditLogs = async () => {
        try {
            const data = await api.get<any, AuditLog[]>("/api/v1/audit-logs")
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
            const data = await api.get<any, IncidentWithDetails[]>("/api/v1/incidents?limit=100")
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
        fetchUserAndRole()
    }, [])

    useEffect(() => {
        if (userRole === "SUPERVISOR") {
            if (activeTab === "logs") {
                loadAuditLogs()
            } else {
                loadIncidents()
            }
        } else if (userRole !== null) {
            // Operator can also view incidents/chats, let's load incidents if activeTab is incidents
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
        setReplyMessage("")
        setReplyStatus(null)
        setRepliesLoading(true)
        try {
            const data = await api.get<any, IncidentReply[]>(`/api/v1/incidents/${incident.id}/replies`)
            setReplies(data || [])
        } catch (err: any) {
            console.error("Gagal memuat balasan:", err)
            toast.error("Gagal memuat riwayat balasan: " + err.message)
        } finally {
            setRepliesLoading(false)
        }
    }

    const handleSendReply = async () => {
        if (!selectedIncident) return
        if (!replyMessage.trim() && !replyStatus) {
            toast.error("Silakan isi pesan atau pilih status baru terlebih dahulu")
            return
        }

        setSubmittingReply(true)
        const toastId = toast.loading("Mengirim balasan...")
        try {
            const reqData: any = {
                message: replyMessage.trim() || `Memperbarui status laporan menjadi ${replyStatus}`,
            }
            if (replyStatus) {
                reqData.status = replyStatus
            }

            const newReply = await api.post<any, IncidentReply>(
                `/api/v1/incidents/${selectedIncident.id}/replies`,
                reqData
            )

            setReplies((prev) => [...prev, newReply])
            
            // Update local incident status
            if (replyStatus) {
                setSelectedIncident((prev) => (prev ? { ...prev, status: replyStatus } : null))
                // Reload lists
                loadIncidents()
            }

            setReplyMessage("")
            setReplyStatus(null)
            toast.success("Balasan berhasil dikirim!", { id: toastId })
        } catch (err: any) {
            console.error("Gagal mengirim balasan:", err)
            toast.error("Gagal mengirim balasan: " + err.message, { id: toastId })
        } finally {
            setSubmittingReply(false)
        }
    }

    // Format action labels and badge styles
    const formatAction = (action: string) => {
        switch (action) {
            case "INCIDENT_CREATED":
                return { label: "Insiden Terdeteksi", className: "bg-red-100 text-red-800 border-red-200" }
            case "INCIDENT_ACKNOWLEDGED":
                return { label: "Insiden Diakui", className: "bg-amber-100 text-amber-800 border-amber-200" }
            case "INCIDENT_RESOLVED":
                return { label: "Insiden Selesai", className: "bg-emerald-100 text-emerald-800 border-emerald-200" }
            case "INCIDENT_DELETED":
                return { label: "Insiden Dihapus", className: "bg-gray-100 text-gray-800 border-gray-200" }
            case "STATUS_UPDATED":
                return { label: "Status Mesin", className: "bg-blue-100 text-blue-800 border-blue-200" }
            case "USER_CREATED":
                return { label: "Pengguna Baru", className: "bg-purple-100 text-purple-800 border-purple-200" }
            case "USER_UPDATED":
                return { label: "Profil Diupdate", className: "bg-indigo-100 text-indigo-800 border-indigo-200" }
            case "USER_DEACTIVATED":
                return { label: "Pengguna Dinonaktifkan", className: "bg-rose-100 text-rose-800 border-rose-200" }
            default:
                return { label: action, className: "bg-gray-100 text-gray-600 border-gray-200" }
        }
    }

    const formatDescription = (log: AuditLog) => {
        const { action, old_value, new_value } = log
        if (action === "STATUS_UPDATED") {
            return (
                <span className="text-gray-700">
                    Mengubah status mesin dari <span className="font-bold text-gray-900">{old_value || "ACTIVE"}</span> ke <span className="font-bold text-emerald-700">{new_value}</span>
                </span>
            )
        }
        if (action === "INCIDENT_ACKNOWLEDGED" || action === "INCIDENT_RESOLVED") {
            return (
                <span className="text-gray-700">
                    Menangani insiden <span className="font-semibold text-gray-900">{new_value}</span>
                </span>
            )
        }
        if (action === "INCIDENT_CREATED") {
            return (
                <span className="text-red-700 font-medium">
                    Terdeteksi anomali: {new_value}
                </span>
            )
        }
        return (
            <span className="text-gray-600">
                {new_value || `Tindakan ${action.toLowerCase()}`}
            </span>
        )
    }

    const getSeverityBadgeClass = (severity: string) => {
        switch (severity) {
            case "CRITICAL":
                return "bg-red-50 text-red-700 border-red-200"
            case "HIGH":
                return "bg-orange-50 text-orange-700 border-orange-200"
            case "MEDIUM":
                return "bg-amber-50 text-amber-700 border-amber-200"
            default:
                return "bg-blue-50 text-blue-700 border-blue-200"
        }
    }

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case "RESOLVED":
                return "bg-emerald-50 text-emerald-700 border-emerald-200"
            case "IN_PROGRESS":
                return "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
            default:
                return "bg-red-50 text-red-700 border-red-200"
        }
    }

    // Filters
    const filteredLogs = logs.filter(
        (l) =>
            l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (l.actor_name && l.actor_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (l.new_value && l.new_value.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (l.ip_address && l.ip_address.includes(searchQuery))
    )

    const filteredIncidents = incidents.filter(
        (i) =>
            i.title.toLowerCase().includes(incidentSearchQuery.toLowerCase()) ||
            i.machine_name.toLowerCase().includes(incidentSearchQuery.toLowerCase()) ||
            i.machine_code.toLowerCase().includes(incidentSearchQuery.toLowerCase()) ||
            i.severity.toLowerCase().includes(incidentSearchQuery.toLowerCase()) ||
            i.status.toLowerCase().includes(incidentSearchQuery.toLowerCase())
    )

    const openIncidentsCount = incidents.filter(i => i.status !== "RESOLVED").length

    if (userRole !== null && userRole !== "SUPERVISOR" && activeTab === "logs") {
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
                    <Button 
                        onClick={() => setActiveTab("incidents")} 
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold h-11 px-6 rounded-xl cursor-pointer"
                    >
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
            {/* Header section */}
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
                            : "Daftar pengaduan insiden dari lapangan. Berikan instruksi langsung dan ubah status laporan."
                        }
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={handleRefresh}
                        disabled={refreshing || loading || incidentsLoading}
                        className="h-11 border-gray-200 hover:bg-gray-50 bg-white"
                    >
                        <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
                        Refresh Data
                    </Button>
                </div>
            </div>

            {/* Custom Premium Tabs */}
            <div className="flex border-b border-gray-200">
                {userRole === "SUPERVISOR" && (
                    <button
                        onClick={() => setActiveTab("logs")}
                        className={cn(
                            "flex items-center gap-2 px-6 py-3 border-b-2 font-semibold text-sm transition-colors cursor-pointer",
                            activeTab === "logs"
                                ? "border-emerald-600 text-emerald-700 bg-emerald-50/30"
                                : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50/50"
                        )}
                    >
                        <Terminal className="h-4 w-4" />
                        Log Jurnal Sistem
                    </button>
                )}
                <button
                    onClick={() => setActiveTab("incidents")}
                    className={cn(
                        "flex items-center gap-2 px-6 py-3 border-b-2 font-semibold text-sm transition-colors cursor-pointer relative",
                        activeTab === "incidents"
                            ? "border-emerald-600 text-emerald-700 bg-emerald-50/30"
                            : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50/50"
                    )}
                >
                    <ShieldAlert className="h-4 w-4" />
                    Respon Laporan Operator
                    {openIncidentsCount > 0 && (
                        <span className="absolute top-2 right-2 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                    )}
                </button>
            </div>

            {/* Tabs Content */}
            {activeTab === "logs" ? (
                /* --- Tab 1: LOG JURNAL SISTEM --- */
                <div className="space-y-4">
                    <div className="relative w-full">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                            placeholder="Cari log berdasarkan aktor, tindakan, deskripsi, atau IP address..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-11 h-12 bg-white border-gray-200 focus-visible:ring-emerald-500 focus-visible:ring-1"
                        />
                    </div>

                    <div className="bg-white/80 backdrop-blur-md rounded-xl border border-gray-200/80 shadow-md overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50/50 text-gray-400 font-semibold border-b border-gray-200/50 uppercase text-[10px] tracking-wider">
                                    <tr>
                                        <th className="px-5 py-4 w-[180px]">Tanggal & Waktu</th>
                                        <th className="px-5 py-4 w-[160px]">Aktor</th>
                                        <th className="px-5 py-4 w-[160px]">Tindakan</th>
                                        <th className="px-5 py-4">Deskripsi / Detail Perubahan</th>
                                        <th className="px-5 py-4 w-[130px] text-center">IP Address</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100/70">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="px-5 py-16 text-center text-gray-400">
                                                <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-300" />
                                                Memuat catatan aktivitas sistem...
                                            </td>
                                        </tr>
                                    ) : filteredLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-5 py-12 text-center text-gray-400">
                                                Tidak ada catatan aktivitas yang cocok dengan pencarian Anda.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredLogs.map((log) => {
                                            const actionMeta = formatAction(log.action)
                                            const formattedTime = new Date(log.created_at).toLocaleString("id-ID", {
                                                year: "numeric",
                                                month: "short",
                                                day: "2-digit",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                                second: "2-digit",
                                            })

                                            return (
                                                <tr key={log.id} className="hover:bg-gray-50/40 transition-colors">
                                                    <td className="px-5 py-4 font-medium text-gray-800 text-xs">
                                                        <div className="flex items-center gap-1.5">
                                                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                                            {formattedTime}
                                                        </div>
                                                    </td>

                                                    <td className="px-5 py-4 text-xs font-semibold text-gray-700">
                                                        <div className="flex items-center gap-1.5">
                                                            <User className="h-3.5 w-3.5 text-gray-400" />
                                                            {log.actor_name || "Sistem (Auto)"}
                                                        </div>
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <span
                                                            className={cn(
                                                                "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border",
                                                                actionMeta.className
                                                            )}
                                                        >
                                                            {actionMeta.label}
                                                        </span>
                                                    </td>

                                                    <td className="px-5 py-4 text-xs font-medium text-gray-600">
                                                        {formatDescription(log)}
                                                    </td>

                                                    <td className="px-5 py-4 text-center font-mono text-[10px] text-gray-400">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <Terminal className="h-3 w-3 text-gray-300" />
                                                            {log.ip_address || "127.0.0.1"}
                                                        </div>
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
            ) : (
                /* --- Tab 2: RESPON LAPORAN OPERATOR --- */
                <div className="space-y-4">
                    <div className="relative w-full">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                            placeholder="Cari laporan berdasarkan judul, mesin, kode, atau status..."
                            value={incidentSearchQuery}
                            onChange={(e) => setIncidentSearchQuery(e.target.value)}
                            className="pl-11 h-12 bg-white border-gray-200 focus-visible:ring-emerald-500 focus-visible:ring-1"
                        />
                    </div>

                    <div className="bg-white/80 backdrop-blur-md rounded-xl border border-gray-200/80 shadow-md overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50/50 text-gray-400 font-semibold border-b border-gray-200/50 uppercase text-[10px] tracking-wider">
                                    <tr>
                                        <th className="px-5 py-4">Insiden / Deskripsi</th>
                                        <th className="px-5 py-4 w-[180px]">Mesin</th>
                                        <th className="px-5 py-4 w-[110px] text-center">Tingkat Bahaya</th>
                                        <th className="px-5 py-4 w-[110px] text-center">Status</th>
                                        <th className="px-5 py-4 w-[160px]">Tanggal Dilaporkan</th>
                                        <th className="px-5 py-4 w-[120px] text-center">Aksi</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100/70">
                                    {incidentsLoading ? (
                                        <tr>
                                            <td colSpan={6} className="px-5 py-16 text-center text-gray-400">
                                                <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-300" />
                                                Memuat daftar pengaduan operator...
                                            </td>
                                        </tr>
                                    ) : filteredIncidents.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                                                Tidak ada pengaduan insiden yang ditemukan.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredIncidents.map((incident) => {
                                            const formattedTime = new Date(incident.created_at).toLocaleString("id-ID", {
                                                month: "short",
                                                day: "2-digit",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })

                                            return (
                                                <tr key={incident.id} className="hover:bg-gray-50/40 transition-colors">
                                                    <td className="px-5 py-4 font-semibold text-gray-900 text-sm">
                                                        <div>{incident.title}</div>
                                                        {incident.description && (
                                                            <div className="text-xs text-gray-500 font-normal line-clamp-1 mt-0.5">
                                                                {incident.description}
                                                            </div>
                                                        )}
                                                    </td>

                                                    <td className="px-5 py-4 text-xs font-semibold text-gray-700">
                                                        <div className="font-mono text-[11px] text-emerald-700">{incident.machine_code}</div>
                                                        <div className="text-gray-500 text-[11px] font-normal">{incident.machine_name}</div>
                                                    </td>

                                                    <td className="px-5 py-4 text-center">
                                                        <span
                                                            className={cn(
                                                                "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                                                                getSeverityBadgeClass(incident.severity)
                                                            )}
                                                        >
                                                            {incident.severity}
                                                        </span>
                                                    </td>

                                                    <td className="px-5 py-4 text-center">
                                                        <span
                                                            className={cn(
                                                                "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                                                                getStatusBadgeClass(incident.status)
                                                            )}
                                                        >
                                                            {incident.status === "IN_PROGRESS" ? "PROSES" : incident.status}
                                                        </span>
                                                    </td>

                                                    <td className="px-5 py-4 text-gray-500 text-xs font-medium">
                                                        {formattedTime}
                                                    </td>

                                                    <td className="px-5 py-4 text-center">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleOpenIncident(incident)}
                                                            className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 rounded-lg text-xs cursor-pointer shadow-sm flex items-center gap-1.5"
                                                        >
                                                            <MessageSquare className="h-3.5 w-3.5" />
                                                            Respon
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
            )}

            {/* --- INCIDENT REPLY & status MODAL --- */}
            {selectedIncident && (
                <ResponsiveModal
                    open={selectedIncident !== null}
                    onOpenChange={(open) => {
                        if (!open) setSelectedIncident(null)
                    }}
                    showCloseButton={true}
                    title="Respon & Arahan Laporan"
                    description={`No. Tiket: #${selectedIncident.id.substring(0, 8)} | Mesin: ${selectedIncident.machine_code}`}
                >
                    <div className="flex flex-col h-[60vh] gap-4">
                        {/* Summary of Incident */}
                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-extrabold border", getSeverityBadgeClass(selectedIncident.severity))}>
                                    {selectedIncident.severity}
                                </span>
                                <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-extrabold border", getStatusBadgeClass(selectedIncident.status))}>
                                    STATUS: {selectedIncident.status}
                                </span>
                            </div>
                            <h3 className="font-bold text-gray-900 text-sm leading-tight">{selectedIncident.title}</h3>
                            {selectedIncident.description && (
                                <p className="text-gray-600 text-xs leading-normal">
                                    {selectedIncident.description}
                                </p>
                            )}
                            <div className="text-[10px] text-gray-400 flex items-center gap-1.5 mt-1 font-medium">
                                <Clock className="h-3 w-3" />
                                Dilaporkan pada {new Date(selectedIncident.created_at).toLocaleString("id-ID")}
                            </div>
                        </div>

                        {/* Message History Thread */}
                        <div className="flex-1 border border-gray-100 rounded-xl bg-gray-50/30 overflow-y-auto p-4 space-y-3 flex flex-col">
                            {repliesLoading ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-10">
                                    <RefreshCw className="h-5 w-5 animate-spin mb-2 text-emerald-600" />
                                    <span className="text-xs">Memuat percakapan...</span>
                                </div>
                            ) : replies.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-10 text-center space-y-2">
                                    <MessageCircle className="h-10 w-10 text-gray-300" />
                                    <div>
                                        <div className="font-semibold text-gray-700 text-xs">Belum ada tanggapan</div>
                                        <div className="text-[10px] max-w-[200px] text-gray-400 mt-0.5">Ketik tanggapan atau instruksi perbaikan untuk operator di bawah ini.</div>
                                    </div>
                                </div>
                            ) : (
                                replies.map((reply) => {
                                    const isMe = reply.user_id === currentUserId
                                    return (
                                        <div
                                            key={reply.id}
                                            className={cn(
                                                "max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-sm flex flex-col",
                                                isMe
                                                    ? "bg-emerald-600 text-white self-end rounded-tr-none"
                                                    : "bg-white border border-gray-100 text-gray-800 self-start rounded-tl-none"
                                            )}
                                        >
                                            <div className="flex items-center gap-1.5 font-bold mb-1">
                                                <span className={isMe ? "text-emerald-100" : "text-gray-800"}>
                                                    {reply.user_name}
                                                </span>
                                                <span
                                                    className={cn(
                                                        "text-[8px] px-1 rounded font-extrabold uppercase",
                                                        isMe
                                                            ? "bg-emerald-700 text-emerald-100"
                                                            : reply.user_role === "SUPERVISOR"
                                                            ? "bg-emerald-100 text-emerald-800"
                                                            : "bg-blue-100 text-blue-800"
                                                    )}
                                                >
                                                    {reply.user_role}
                                                </span>
                                            </div>
                                            <p className="leading-relaxed whitespace-pre-wrap">{reply.message}</p>
                                            <span
                                                className={cn(
                                                    "text-[8px] mt-1.5 text-right font-medium self-end",
                                                    isMe ? "text-emerald-200" : "text-gray-400"
                                                )}
                                            >
                                                {new Date(reply.created_at).toLocaleTimeString("id-ID", {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </span>
                                        </div>
                                    )
                                })
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Reply Form */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-3">
                                <Label className="text-xs font-bold text-gray-700">Tindakan & Ubah Status</Label>
                                <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                                    <button
                                        type="button"
                                        onClick={() => setReplyStatus(replyStatus === "IN_PROGRESS" ? null : "IN_PROGRESS")}
                                        className={cn(
                                            "px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-all",
                                            replyStatus === "IN_PROGRESS" || selectedIncident.status === "IN_PROGRESS" && replyStatus === null
                                                ? "bg-amber-500 text-white shadow-sm"
                                                : "text-gray-500 hover:text-gray-800 hover:bg-gray-200/50"
                                        )}
                                    >
                                        PROSES
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setReplyStatus(replyStatus === "RESOLVED" ? null : "RESOLVED")}
                                        className={cn(
                                            "px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-all",
                                            replyStatus === "RESOLVED" || selectedIncident.status === "RESOLVED" && replyStatus === null
                                                ? "bg-emerald-600 text-white shadow-sm"
                                                : "text-gray-500 hover:text-gray-800 hover:bg-gray-200/50"
                                        )}
                                    >
                                        SELESAI
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-end gap-2">
                                <textarea
                                    value={replyMessage}
                                    onChange={(e) => setReplyMessage(e.target.value)}
                                    placeholder={
                                        replyStatus
                                            ? `Ketik arahan pelengkap untuk mengubah status ke ${replyStatus}...`
                                            : "Ketik arahan atau balasan perbaikan..."
                                    }
                                    className="flex-1 min-h-[44px] max-h-[120px] rounded-xl border border-gray-200 bg-white p-3 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault()
                                            handleSendReply()
                                        }
                                    }}
                                />
                                <Button
                                    onClick={handleSendReply}
                                    disabled={submittingReply || (!replyMessage.trim() && !replyStatus)}
                                    className="h-11 w-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white p-0 flex items-center justify-center cursor-pointer shadow-md"
                                >
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </ResponsiveModal>
            )}
        </div>
    )
}