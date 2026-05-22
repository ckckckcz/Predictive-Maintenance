"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
    Plus,
    Edit2,
    Search,
    MapPin,
    Eye,
    Power,
    ShieldAlert,
    RefreshCw,
    Info,
    Settings2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ResponsiveModal } from "@/components/dashboard/responsive-modal"
import { Card, CardContent } from "@/components/ui/card"
import { api } from "@/lib/api"
import toast from "react-hot-toast"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface Machine {
    id: string
    name: string
    code: string
    type: string
    location: string | null
    status: "ACTIVE" | "INACTIVE" | "MAINTENANCE"
    created_at: string
}

export default function OperationsPage() {
    const [machines, setMachines] = useState<Machine[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [userRole, setUserRole] = useState<string | null>(null)
    const [refreshing, setRefreshing] = useState(false)

    // Form states for creating a new machine
    const [newMachineName, setNewMachineName] = useState("")
    const [newMachineCode, setNewMachineCode] = useState("")
    const [newMachineType, setNewMachineType] = useState("CONVEYOR")
    const [newMachineLocation, setNewMachineLocation] = useState("")
    const [submitLoading, setSubmitLoading] = useState(false)

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

    const loadMachines = async () => {
        try {
            const data = await api.get<any, Machine[]>("/api/v1/machines")
            setMachines(data || [])
        } catch (err: any) {
            console.error("Gagal memuat mesin:", err)
            toast.error("Gagal memuat daftar mesin: " + err.message)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        fetchUserAndRole()
        loadMachines()

        const interval = setInterval(loadMachines, 5000)
        return () => clearInterval(interval)
    }, [])

    const handleRefresh = () => {
        setRefreshing(true)
        loadMachines()
    }

    // Toggle machine ON/OFF (ACTIVE/INACTIVE)
    const handleToggleStatus = async (machineId: string, currentStatus: string) => {
        if (userRole !== "SUPERVISOR") {
            toast.error("Akses Ditolak: Anda membutuhkan peran SUPERVISOR untuk mengontrol mesin.")
            return
        }

        const targetStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE"
        const toastId = toast.loading(`Mengubah status mesin menjadi ${targetStatus}...`)

        try {
            await api.patch(`/api/v1/machines/${machineId}/status`, {
                status: targetStatus,
            })
            toast.success(`Mesin berhasil ${targetStatus === "ACTIVE" ? "diaktifkan" : "dinonaktifkan"}`, { id: toastId })
            loadMachines()
        } catch (err: any) {
            toast.error(`Gagal mengubah status: ${err.message}`, { id: toastId })
        }
    }

    // Create a new machine
    const handleCreateMachine = async () => {
        if (!newMachineName || !newMachineCode || !newMachineType) {
            toast.error("Silakan isi semua bidang wajib (Nama, Kode, Tipe)")
            return
        }

        setSubmitLoading(true)
        const toastId = toast.loading("Membuat mesin baru...")

        try {
            await api.post("/api/v1/machines", {
                name: newMachineName,
                code: newMachineCode,
                type: newMachineType,
                location: newMachineLocation || null,
            })
            toast.success("Mesin baru berhasil ditambahkan!", { id: toastId })
            setIsFormOpen(false)

            // Clear form
            setNewMachineName("")
            setNewMachineCode("")
            setNewMachineType("CONVEYOR")
            setNewMachineLocation("")

            loadMachines()
        } catch (err: any) {
            toast.error(`Gagal menambah mesin: ${err.message}`, { id: toastId })
        } finally {
            setSubmitLoading(false)
        }
    }

    // Filter machines by query
    const filteredMachines = machines.filter(
        (m) =>
            m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (m.location && m.location.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    const isSupervisor = userRole === "SUPERVISOR"

    return (
        <div className="space-y-6">
            {/* Breadcrumb & Header */}
            <div className="space-y-4">
                <div className="text-sm text-gray-500 flex items-center gap-2">
                    Home <span className="text-gray-300">/</span> <span className="text-gray-900 font-medium">Operation</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                            Manajemen Operasional Mesin
                        </h1>
                        <p className="text-gray-500 text-sm">
                            Kendalikan status operasional mesin pabrik dan daftarkan mesin baru.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="h-11 border-gray-200 hover:bg-gray-50 bg-white"
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>

                        {isSupervisor && (
                            <Button
                                onClick={() => setIsFormOpen(true)}
                                className="gap-2 text-white h-11 bg-emerald-600 hover:bg-emerald-700 font-semibold cursor-pointer shadow-md shadow-emerald-100"
                            >
                                <Plus className="h-4 w-4" />
                                Tambah Mesin
                            </Button>
                        )}
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                        placeholder="Cari mesin berdasarkan nama, kode, atau lokasi..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-11 h-12 bg-white border-gray-200 focus-visible:ring-emerald-500 focus-visible:ring-1"
                    />
                </div>
            </div>

            {/* Modal for Creating Machine */}
            <ResponsiveModal
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                showCloseButton={false}
                forceDrawerOnMobile={true}
                title="Tambah Mesin Pabrik Baru"
                footer={
                    <div className="flex gap-3 w-full">
                        <Button
                            onClick={handleCreateMachine}
                            disabled={submitLoading}
                            className="flex-1 h-11 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 cursor-pointer"
                        >
                            {submitLoading ? "Menyimpan..." : "Simpan Mesin"}
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => setIsFormOpen(false)}
                            className="flex-1 h-11 border-gray-200 hover:bg-gray-100 cursor-pointer"
                        >
                            Batal
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="mName" className="text-sm font-semibold text-gray-700">
                            Nama Mesin
                        </Label>
                        <Input
                            id="mName"
                            placeholder="Contoh: Boiler Unit Utama"
                            value={newMachineName}
                            onChange={(e) => setNewMachineName(e.target.value)}
                            className="h-11 bg-white border-gray-200"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="mCode" className="text-sm font-semibold text-gray-700">
                                Kode Mesin (Unik)
                            </Label>
                            <Input
                                id="mCode"
                                placeholder="Contoh: BLR-001"
                                value={newMachineCode}
                                onChange={(e) => setNewMachineCode(e.target.value)}
                                className="h-11 bg-white border-gray-200"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold text-gray-700">
                                Tipe Mesin
                            </Label>
                            <Select value={newMachineType} onValueChange={setNewMachineType}>
                                <SelectTrigger className="h-11 w-full bg-white border-gray-200">
                                    <SelectValue placeholder="Pilih Tipe" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PASTEURISASI">PASTEURISASI</SelectItem>
                                    <SelectItem value="FILLING">FILLING</SelectItem>
                                    <SelectItem value="CONVEYOR">CONVEYOR</SelectItem>
                                    <SelectItem value="COLD_STORAGE">COLD_STORAGE</SelectItem>
                                    <SelectItem value="BOILER">BOILER</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="mLoc" className="text-sm font-semibold text-gray-700">
                            Lokasi / Area Pabrik
                        </Label>
                        <Input
                            id="mLoc"
                            placeholder="Contoh: Lantai 3 - Area A"
                            value={newMachineLocation}
                            onChange={(e) => setNewMachineLocation(e.target.value)}
                            className="h-11 bg-white border-gray-200"
                        />
                    </div>
                </div>
            </ResponsiveModal>

            {/* Grid of Cards */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
                    <RefreshCw className="h-8 w-8 text-emerald-500 animate-spin mb-4" />
                    <p className="text-gray-500 font-medium">Memuat konfigurasi operasional...</p>
                </div>
            ) : filteredMachines.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                    <div className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <Search className="h-6 w-6 text-gray-300" />
                    </div>
                    <p className="text-gray-500 font-medium">Tidak ada mesin yang ditemukan.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredMachines.map((m) => {
                        const isActive = m.status === "ACTIVE"
                        return (
                            <Card key={m.id} className="p-5 space-y-4 border-gray-200/80 shadow-md rounded-2xl bg-white/70 backdrop-blur-md transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
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
                                </div>

                                {/* Machine Type Display */}
                                <div className="bg-gray-50/80 rounded-xl p-3 space-y-1 border border-gray-100/50">
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                        <Settings2 className="h-3 w-3" />
                                        Tipe Peralatan
                                    </div>
                                    <div className="text-xs text-gray-700 font-bold">
                                        {m.type}
                                    </div>
                                </div>

                                {/* Active Toggle Section (Supervisor Only Role-protection display) */}
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
                                        onClick={() => handleToggleStatus(m.id, m.status)}
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
                                    <Link href={`/dashboard/operation/${m.id}`} className="flex-1">
                                        <Button className="w-full h-10 bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5 rounded-xl font-bold shadow-md shadow-emerald-100 cursor-pointer">
                                            <Eye className="h-4 w-4" />
                                            Buka Mesin
                                        </Button>
                                    </Link>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}