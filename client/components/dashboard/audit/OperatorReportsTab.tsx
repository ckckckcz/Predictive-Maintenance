import { useState } from "react"
import { Search, RefreshCw, MessageSquare } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { IncidentWithDetails } from "@/types/audit"

interface OperatorReportsTabProps {
    incidents: IncidentWithDetails[]
    loading: boolean
    onOpenIncident: (incident: IncidentWithDetails) => void
}

export function OperatorReportsTab({ incidents, loading, onOpenIncident }: OperatorReportsTabProps) {
    const [searchQuery, setSearchQuery] = useState("")

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

    const filteredIncidents = incidents.filter(
        (i) =>
            i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            i.machine_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            i.machine_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            i.severity.toLowerCase().includes(searchQuery.toLowerCase()) ||
            i.status.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-4">
            <div className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                    placeholder="Cari laporan berdasarkan judul, mesin, kode, atau status..."
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
                                <th className="px-5 py-4">Insiden / Deskripsi</th>
                                <th className="px-5 py-4 w-[180px]">Mesin</th>
                                <th className="px-5 py-4 w-[110px] text-center">Tingkat Bahaya</th>
                                <th className="px-5 py-4 w-[110px] text-center">Status</th>
                                <th className="px-5 py-4 w-[160px]">Tanggal Dilaporkan</th>
                                <th className="px-5 py-4 w-[120px] text-center">Aksi</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100/70">
                            {loading ? (
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
                                                {incident.supervisor_response && (
                                                    <div className="text-xs text-emerald-700 bg-emerald-50/70 border border-emerald-100 rounded-lg p-2 mt-2 font-normal flex items-start gap-1.5">
                                                        <span className="font-bold text-[10px] text-emerald-800 uppercase tracking-wider bg-emerald-100 px-1 rounded-sm mt-0.5">Respon Spv:</span>
                                                        <span className="flex-1 whitespace-pre-wrap">{incident.supervisor_response}</span>
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
                                                    onClick={() => onOpenIncident(incident)}
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
    )
}
