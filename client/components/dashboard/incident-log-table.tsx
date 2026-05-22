"use client"

import { ChevronLeft, ChevronRight, AlertTriangle, CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Incident } from "@/types/machine"

interface Props {
    incidents: Incident[]
    currentPage: number
    setCurrentPage: (fn: (p: number) => number) => void
}

const ITEMS_PER_PAGE = 10

const SEVERITY_CLASSES: Record<string, string> = {
    CRITICAL: "bg-rose-50 text-rose-700 border-rose-200",
    HIGH: "bg-orange-50 text-orange-700 border-orange-200",
    MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
    LOW: "bg-blue-50 text-blue-700 border-blue-200",
}
const STATUS_CLASSES: Record<string, string> = {
    OPEN: "bg-red-50 text-red-600 border-red-200",
    IN_PROGRESS: "bg-amber-50 text-amber-600 border-amber-200",
    RESOLVED: "bg-emerald-50 text-emerald-600 border-emerald-200",
}

export function IncidentLogTable({ incidents, currentPage, setCurrentPage }: Props) {
    const activeIncidents = incidents.filter(i => i.status === "OPEN" || i.status === "IN_PROGRESS")
    const sorted = [...incidents].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    const totalItems = sorted.length
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)
    const activePage = Math.min(currentPage, Math.max(1, totalPages))
    const startIndex = (activePage - 1) * ITEMS_PER_PAGE
    const paginated = sorted.slice(startIndex, startIndex + ITEMS_PER_PAGE)

    const getPageNumbers = () => {
        const pages: (number | string)[] = []
        if (totalPages <= 5) { for (let i = 1; i <= totalPages; i++) pages.push(i) }
        else if (activePage <= 3) { for (let i = 1; i <= 4; i++) pages.push(i); pages.push("..."); pages.push(totalPages) }
        else if (activePage >= totalPages - 2) { pages.push(1); pages.push("..."); for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i) }
        else { pages.push(1, "...", activePage - 1, activePage, activePage + 1, "...", totalPages) }
        return pages
    }

    return (
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
                        <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <div className="bg-slate-50 rounded-lg p-1.5 border border-slate-200">
                                <AlertTriangle className="h-4 w-4 text-slate-600" />
                            </div>
                            Log Riwayat Anomali ({incidents.length})
                        </CardTitle>
                        <CardDescription className="text-xs mt-1 text-gray-500">
                            Seluruh catatan historis deteksi anomali dan status incident pada mesin ini.
                        </CardDescription>
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
                                    {paginated.map((incident) => (
                                        <tr key={incident.id} className="hover:bg-gray-50/50 transition-colors text-xs">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge className={cn("font-extrabold text-[10px] tracking-wider border px-2.5 py-0.5 rounded-full shadow-none", SEVERITY_CLASSES[incident.severity])}>
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
                                                <Badge className={cn("font-extrabold text-[9px] px-2 py-0.5 border rounded-md shadow-none", STATUS_CLASSES[incident.status])}>
                                                    {incident.status}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/30">
                                <div className="text-xs text-gray-500 font-medium">
                                    Menampilkan <span className="font-semibold text-gray-800">{startIndex + 1}</span>{" "}
                                    - <span className="font-semibold text-gray-800">{Math.min(startIndex + ITEMS_PER_PAGE, totalItems)}</span>{" "}
                                    dari <span className="font-semibold text-gray-800">{totalItems}</span> log
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-gray-200 bg-white hover:bg-slate-50 cursor-pointer disabled:opacity-50" disabled={activePage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
                                        <ChevronLeft className="h-4 w-4 text-slate-600" />
                                    </Button>
                                    {getPageNumbers().map((page, idx) =>
                                        page === "..." ? (
                                            <span key={`dots-${idx}`} className="px-2 text-xs text-gray-400 font-bold">...</span>
                                        ) : (
                                            <Button key={page} variant={activePage === page ? "default" : "outline"}
                                                className={cn("h-8 w-8 text-xs font-bold rounded-lg cursor-pointer", activePage === page ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-none border-none" : "border-gray-200 bg-white text-slate-600 hover:bg-slate-50")}
                                                onClick={() => setCurrentPage(() => page as number)}>
                                                {page}
                                            </Button>
                                        )
                                    )}
                                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-gray-200 bg-white hover:bg-slate-50 cursor-pointer disabled:opacity-50" disabled={activePage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>
                                        <ChevronRight className="h-4 w-4 text-slate-600" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
