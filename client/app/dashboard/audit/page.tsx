"use client"

import { useState, useEffect } from "react"
import {
    Activity,
    ShieldAlert,
    RefreshCw,
    Search,
    Calendar,
    User,
    Terminal,
    Lock,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

export default function AuditLogPage() {
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [loading, setLoading] = useState(true)
    const [userRole, setUserRole] = useState<string | null>(null)
    const [refreshing, setRefreshing] = useState(false)

    const fetchUserAndRole = () => {
        if (typeof window !== "undefined") {
            const userStr = localStorage.getItem("user")
            if (userStr) {
                try {
                    const user = JSON.parse(userStr)
                    setUserRole(user.role)
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
            // Silence toast error if it is a 403 (unauthorized role) since we handle it in UI
            if (err.status !== 403 && err.message?.indexOf("403") === -1) {
                toast.error("Gagal memuat log audit: " + err.message)
            }
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        fetchUserAndRole()
    }, [])

    useEffect(() => {
        if (userRole === "SUPERVISOR") {
            loadAuditLogs()
            const interval = setInterval(loadAuditLogs, 10000)
            return () => clearInterval(interval)
        } else if (userRole !== null) {
            setLoading(false)
        }
    }, [userRole])

    const handleRefresh = () => {
        setRefreshing(true)
        loadAuditLogs()
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

    // Format values change description
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

    // Filter logs by search query
    const filteredLogs = logs.filter(
        (l) =>
            l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (l.actor_name && l.actor_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (l.new_value && l.new_value.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (l.ip_address && l.ip_address.includes(searchQuery))
    )

    if (userRole !== null && userRole !== "SUPERVISOR") {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4 bg-white/70 backdrop-blur-md rounded-2xl border border-gray-200 shadow-md max-w-2xl mx-auto mt-10">
                <div className="h-16 w-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-5 border border-amber-200">
                    <Lock className="h-8 w-8 text-amber-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Akses Halaman Terbatas</h2>
                <p className="text-gray-500 text-center text-sm max-w-md mb-6">
                    Maaf, halaman Log Audit Sistem hanya dapat diakses oleh pengguna dengan hak akses <span className="font-bold text-amber-700">SUPERVISOR</span>.
                </p>
                <Link href="/dashboard" className="w-full sm:w-auto">
                    <Button className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 text-white font-semibold h-11 px-6 rounded-xl cursor-pointer">
                        Kembali ke Dashboard
                    </Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                        Home <span className="text-gray-300">/</span> <span className="text-gray-900 font-medium">Audit Log</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                        Log Audit Sistem
                    </h1>
                    <p className="text-gray-500 text-sm">
                        Jurnal audit komprehensif atas seluruh tindakan pengguna dan deteksi anomali sistem.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={handleRefresh}
                        disabled={refreshing || loading}
                        className="h-11 border-gray-200 hover:bg-gray-50 bg-white"
                    >
                        <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
                        Refresh Log
                    </Button>
                </div>
            </div>

            {/* Filter Search */}
            <div className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                    placeholder="Cari log berdasarkan aktor, tindakan, deskripsi, atau IP address..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-11 h-12 bg-white border-gray-200 focus-visible:ring-emerald-500 focus-visible:ring-1"
                />
            </div>

            {/* Table logs */}
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
                                            {/* Created At */}
                                            <td className="px-5 py-4 font-medium text-gray-800 text-xs">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                                    {formattedTime}
                                                </div>
                                            </td>

                                            {/* Actor */}
                                            <td className="px-5 py-4 text-xs font-semibold text-gray-700">
                                                <div className="flex items-center gap-1.5">
                                                    <User className="h-3.5 w-3.5 text-gray-400" />
                                                    {log.actor_name || "Sistem (Auto)"}
                                                </div>
                                            </td>

                                            {/* Action Badge */}
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

                                            {/* Description */}
                                            <td className="px-5 py-4 text-xs font-medium text-gray-600">
                                                {formatDescription(log)}
                                            </td>

                                            {/* IP Address */}
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
    )
}