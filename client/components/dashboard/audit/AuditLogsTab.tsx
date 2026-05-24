import { useState } from "react"
import { Search, RefreshCw, Calendar, User, Terminal } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { AuditLog } from "@/types/audit"

interface AuditLogsTabProps {
    logs: AuditLog[]
    loading: boolean
}

export function AuditLogsTab({ logs, loading }: AuditLogsTabProps) {
    const [searchQuery, setSearchQuery] = useState("")

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

    const filteredLogs = logs.filter(
        (l) =>
            l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (l.actor_name && l.actor_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (l.new_value && l.new_value.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (l.ip_address && l.ip_address.includes(searchQuery))
    )

    return (
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
    )
}
