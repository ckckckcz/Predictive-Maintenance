"use client"

import { useState, useEffect } from "react"
import { Plus, Search, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import toast from "react-hot-toast"

import { useUserRole } from "@/hooks/useUserRole"
import { machineService } from "@/services/machineService"
import { areaService } from "@/services/areaService"
import { machineTypeService } from "@/services/machineTypeService"
import { mechanicService } from "@/services/mechanicService"
import { Machine, Mechanic } from "@/types/machine"
import { MachineCard } from "@/components/dashboard/operation/MachineCard"
import { MachineModal } from "@/components/dashboard/operation/MachineModal"

export default function OperationsPage() {
    const [machines, setMachines] = useState<Machine[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const { isSupervisor } = useUserRole()

    // Master data states
    const [areas, setAreas] = useState<{ id: string; name: string; code: string }[]>([])
    const [machineTypes, setMachineTypes] = useState<{ id: string; name: string; code: string }[]>([])
    const [mechanics, setMechanics] = useState<Mechanic[]>([])

    // Form states
    const [formName, setFormName] = useState("")
    const [formCode, setFormCode] = useState("")
    const [formType, setFormType] = useState("")
    const [formLocation, setFormLocation] = useState("")
    const [formMechanicId, setFormMechanicId] = useState("none")
    const [submitLoading, setSubmitLoading] = useState(false)

    // Edit states
    const [editingMachine, setEditingMachine] = useState<Machine | null>(null)
    const [isEditFormOpen, setIsEditFormOpen] = useState(false)

    const loadMachines = async () => {
        try {
            const data = await machineService.getAll()
            setMachines(data || [])
        } catch (err: any) {
            console.error("Gagal memuat mesin:", err)
            toast.error("Gagal memuat daftar mesin: " + err.message)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const loadMasterData = async () => {
        try {
            const [areasData, typesData, mechanicsData] = await Promise.all([
                areaService.getAll(),
                machineTypeService.getAll(),
                mechanicService.getAll()
            ])
            setAreas(areasData || [])
            setMachineTypes(typesData || [])
            setMechanics(mechanicsData || [])
        } catch (err: any) {
            console.error("Gagal memuat master data:", err)
        }
    }

    useEffect(() => {
        loadMachines()
        loadMasterData()

        const interval = setInterval(loadMachines, 5000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        if (machineTypes.length > 0 && !formType) {
            setFormType(machineTypes[0].code)
        }
    }, [machineTypes, formType])

    const handleRefresh = () => {
        setRefreshing(true)
        loadMachines()
        loadMasterData()
    }

    const handleToggleStatus = async (machineId: string, currentStatus: string) => {
        if (!isSupervisor) {
            toast.error("Akses Ditolak: Anda membutuhkan peran SUPERVISOR untuk mengontrol mesin.")
            return
        }

        const targetStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE"
        const toastId = toast.loading(`Mengubah status mesin menjadi ${targetStatus}...`)

        try {
            await machineService.toggleStatus(machineId, targetStatus)
            toast.success(`Mesin berhasil ${targetStatus === "ACTIVE" ? "diaktifkan" : "dinonaktifkan"}`, { id: toastId })
            loadMachines()
        } catch (err: any) {
            toast.error(`Gagal mengubah status: ${err.message}`, { id: toastId })
        }
    }

    const handleCreateMachine = async () => {
        if (!formName || !formCode || !formType) {
            toast.error("Silakan isi semua bidang wajib (Nama, Kode, Tipe)")
            return
        }

        setSubmitLoading(true)
        const toastId = toast.loading("Membuat mesin baru...")

        try {
            await machineService.create({
                name: formName,
                code: formCode,
                type: formType,
                location: formLocation || null,
                mechanic_id: (formMechanicId && formMechanicId !== "none") ? formMechanicId : null,
            })
            toast.success("Mesin baru berhasil ditambahkan!", { id: toastId })
            setIsFormOpen(false)

            setFormName("")
            setFormCode("")
            setFormType(machineTypes.length > 0 ? machineTypes[0].code : "")
            setFormLocation("")
            setFormMechanicId("none")

            loadMachines()
        } catch (err: any) {
            toast.error(`Gagal menambah mesin: ${err.message}`, { id: toastId })
        } finally {
            setSubmitLoading(false)
        }
    }

    const handleOpenEditModal = (m: Machine) => {
        setEditingMachine(m)
        setFormName(m.name)
        setFormCode(m.code)
        setFormType(m.type)
        setFormLocation(m.location || "")
        setFormMechanicId(m.mechanic_id || "none")
        setIsEditFormOpen(true)
    }

    const handleUpdateMachine = async () => {
        if (!editingMachine) return
        if (!formName || !formCode || !formType) {
            toast.error("Silakan isi semua bidang wajib (Nama, Kode, Tipe)")
            return
        }

        setSubmitLoading(true)
        const toastId = toast.loading("Memperbarui data mesin...")

        try {
            await machineService.update(editingMachine.id, {
                name: formName,
                code: formCode,
                type: formType,
                location: formLocation || null,
                mechanic_id: (formMechanicId && formMechanicId !== "none") ? formMechanicId : null,
            })
            toast.success("Mesin berhasil diperbarui!", { id: toastId })
            setIsEditFormOpen(false)
            setEditingMachine(null)
            loadMachines()
        } catch (err: any) {
            toast.error(`Gagal memperbarui mesin: ${err.message}`, { id: toastId })
        } finally {
            setSubmitLoading(false)
        }
    }

    const handleDeleteMachine = async (machineId: string) => {
        if (!isSupervisor) {
            toast.error("Akses Ditolak: Anda membutuhkan peran SUPERVISOR untuk menghapus mesin.")
            return
        }

        if (!confirm("Apakah Anda yakin ingin menghapus mesin ini? Semua data sensor, insiden, dan log terkait akan ikut terhapus secara permanen.")) {
            return
        }

        const toastId = toast.loading("Menghapus mesin...")

        try {
            await machineService.delete(machineId)
            toast.success("Mesin berhasil dihapus!", { id: toastId })
            loadMachines()
        } catch (err: any) {
            toast.error(`Gagal menghapus mesin: ${err.message}`, { id: toastId })
        }
    }

    const filteredMachines = machines.filter(
        (m) =>
            m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (m.location && m.location.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="text-sm text-gray-500 flex items-center gap-2">
                    Home <span className="text-gray-300">/</span> <span className="text-gray-900 font-medium">Operation</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Manajemen Operasional Mesin</h1>
                        <p className="text-gray-500 text-sm">Kendalikan status operasional mesin pabrik dan daftarkan mesin baru.</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={handleRefresh} disabled={refreshing} className="h-11 border-gray-200 hover:bg-gray-50 bg-white">
                            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} /> Refresh
                        </Button>

                        {isSupervisor && (
                            <Button onClick={() => { setFormName(""); setFormCode(""); setFormLocation(""); setFormMechanicId("none"); setIsFormOpen(true) }} className="gap-2 text-white h-11 bg-emerald-600 hover:bg-emerald-700 font-semibold cursor-pointer shadow-md shadow-emerald-100">
                                <Plus className="h-4 w-4" /> Tambah Mesin
                            </Button>
                        )}
                    </div>
                </div>

                <div className="relative w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input placeholder="Cari mesin berdasarkan nama, kode, atau lokasi..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-11 h-12 bg-white border-gray-200 focus-visible:ring-emerald-500 focus-visible:ring-1" />
                </div>
            </div>

            <MachineModal
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                title="Tambah Mesin Pabrik Baru"
                name={formName}
                setName={setFormName}
                code={formCode}
                setCode={setFormCode}
                type={formType}
                setType={setFormType}
                location={formLocation}
                setLocation={setFormLocation}
                mechanicId={formMechanicId}
                setMechanicId={setFormMechanicId}
                submitLoading={submitLoading}
                onSubmit={handleCreateMachine}
                areas={areas}
                machineTypes={machineTypes}
                mechanics={mechanics}
            />

            <MachineModal
                open={isEditFormOpen}
                onOpenChange={(open) => { setIsEditFormOpen(open); if (!open) setEditingMachine(null) }}
                title="Edit Data Mesin Pabrik"
                name={formName}
                setName={setFormName}
                code={formCode}
                setCode={setFormCode}
                type={formType}
                setType={setFormType}
                location={formLocation}
                setLocation={setFormLocation}
                mechanicId={formMechanicId}
                setMechanicId={setFormMechanicId}
                submitLoading={submitLoading}
                onSubmit={handleUpdateMachine}
                areas={areas}
                machineTypes={machineTypes}
                mechanics={mechanics}
            />

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
                    <RefreshCw className="h-8 w-8 text-emerald-500 animate-spin mb-4" />
                    <p className="text-gray-500 font-medium">Memuat konfigurasi operasional...</p>
                </div>
            ) : filteredMachines.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
					<div className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center mb-4"><Search className="h-6 w-6 text-gray-300" /></div>
					<p className="text-gray-500 font-medium">Tidak ada mesin yang ditemukan.</p>
				</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredMachines.map((m) => {
                        const idx = machines.findIndex(x => x.id === m.id)
                        const machineNum = idx !== -1 ? String(idx + 1) : m.id
                        return (
                            <MachineCard
                                key={m.id}
                                m={m}
                                machineNum={machineNum}
                                isSupervisor={isSupervisor}
                                onOpenEdit={handleOpenEditModal}
                                onDelete={handleDeleteMachine}
                                onToggleStatus={handleToggleStatus}
                            />
                        )
                    })}
                </div>
            )}
        </div>
    )
}