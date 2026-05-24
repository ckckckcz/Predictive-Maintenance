import Link from "next/link"
import { MapPin, Edit2, Trash2, Settings2, Wrench, ShieldAlert, Power, Eye } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Machine } from "@/types/machine"

interface MachineCardProps {
    m: Machine
    machineNum: string
    isSupervisor: boolean
    onOpenEdit: (m: Machine) => void
    onDelete: (id: string) => void
    onToggleStatus: (id: string, currentStatus: string) => void
}

export function MachineCard({
    m,
    machineNum,
    isSupervisor,
    onOpenEdit,
    onDelete,
    onToggleStatus,
}: MachineCardProps) {
    const isActive = m.status === "ACTIVE"

    return (
        <Card className="p-5 space-y-4 border-gray-200/80 shadow-md rounded-2xl bg-white/70 backdrop-blur-md transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
            {/* Card Header */}
            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <h3 className="text-md font-bold text-gray-900 truncate max-w-[180px]">{m.name}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${m.status === "ACTIVE"
                                ? "bg-emerald-100 text-emerald-700"
                                : m.status === "MAINTENANCE"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-gray-100 text-gray-500"
                            }`}>
                            {m.status}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-gray-500">
                        <span className="font-bold text-gray-400 tracking-wide">{m.code}</span>
                        <span className="h-1 w-1 bg-gray-300 rounded-full" />
                        <div className="flex items-center gap-0.5 font-medium">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            {m.location || "Lokasi Belum Diset"}
                        </div>
                    </div>
                </div>

                {isSupervisor && (
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onOpenEdit(m)}
                            className="h-8 w-8 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer transition-colors"
                        >
                            <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(m.id)}
                            className="h-8 w-8 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>

            {/* Machine Type Display & Mechanic PIC */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50/80 rounded-xl p-3 space-y-1 border border-gray-100/50">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        <Settings2 className="h-3 w-3" />
                        Tipe Peralatan
                    </div>
                    <div className="text-xs text-gray-700 font-bold truncate">
                        {m.type}
                    </div>
                </div>

                <div className="bg-gray-50/80 rounded-xl p-3 space-y-1 border border-gray-100/50">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        <Wrench className="h-3 w-3 text-emerald-600" />
                        PIC / Mekanik
                    </div>
                    <div className="text-xs text-gray-700 font-bold truncate" title={m.mechanic ? `${m.mechanic.name} (${m.mechanic.specialization})` : "Belum Ditentukan"}>
                        {m.mechanic ? m.mechanic.name : "Belum Ditentukan"}
                    </div>
                </div>
            </div>

            {/* Active Toggle Section */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 border border-gray-100">
                <div className="flex items-center gap-1.5">
                    {isSupervisor ? (
                        <span className="text-xs font-semibold text-gray-600">Kontrol Daya</span>
                    ) : (
                        <div className="flex items-center gap-1 text-xs font-semibold text-gray-400">
                            <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                            Supervisor Only
                        </div>
                    )}
                </div>

                <Button
                    size="sm"
                    variant={isActive ? "default" : "outline"}
                    onClick={() => onToggleStatus(m.id, m.status)}
                    disabled={!isSupervisor}
                    className={`h-8 gap-1.5 text-xs font-bold px-3 rounded-lg cursor-pointer transition-all duration-300 ${isActive
                            ? "bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-100"
                            : "bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                >
                    <Power className="h-3 w-3" />
                    {isActive ? "Matikan" : "Aktifkan"}
                </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
                <Link href={`/dashboard/operation/${machineNum}`} className="flex-1">
                    <Button className="w-full h-10 bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5 rounded-xl font-bold shadow-md shadow-emerald-100 cursor-pointer">
                        <Eye className="h-4 w-4" />
                        Buka Mesin
                    </Button>
                </Link>
            </div>
        </Card>
    )
}
