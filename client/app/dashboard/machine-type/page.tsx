"use client"

import { useState, useEffect } from "react"
import { Plus, Edit2, Trash2, Search, Settings, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ResponsiveModal } from "@/components/dashboard/responsive-modal"
import toast from "react-hot-toast"
import { useUserRole } from "@/hooks/useUserRole"
import { machineTypeService } from "@/services/machineTypeService"
import { MachineType } from "@/types/machine-type"

export default function MachineTypePage() {
	const [machineTypes, setMachineTypes] = useState<MachineType[]>([])
	const [searchQuery, setSearchQuery] = useState("")
	const [loading, setLoading] = useState(true)
	const [refreshing, setRefreshing] = useState(false)
	const { isSupervisor } = useUserRole()

	// Modal & Form states
	const [isFormOpen, setIsFormOpen] = useState(false)
	const [isEditOpen, setIsEditOpen] = useState(false)
	const [selectedMachineType, setSelectedMachineType] = useState<MachineType | null>(null)
	const [name, setName] = useState("")
	const [code, setCode] = useState("")
	const [submitLoading, setSubmitLoading] = useState(false)

	const loadMachineTypes = async () => {
		try {
			const data = await machineTypeService.getAll()
			setMachineTypes(data || [])
		} catch (err: any) {
			console.error("Gagal memuat tipe mesin:", err)
			toast.error("Gagal memuat daftar tipe mesin: " + err.message)
		} finally {
			setLoading(false)
			setRefreshing(false)
		}
	}

	useEffect(() => {
		loadMachineTypes()
	}, [])

	const handleRefresh = () => {
		setRefreshing(true)
		loadMachineTypes()
	}

	const handleCreate = async () => {
		if (!name || !code) {
			toast.error("Silakan isi nama dan kode tipe mesin")
			return
		}
		setSubmitLoading(true)
		const toastId = toast.loading("Membuat tipe mesin baru...")
		try {
			await machineTypeService.create(name, code)
			toast.success("Tipe mesin baru berhasil ditambahkan!", { id: toastId })
			setIsFormOpen(false)
			setName("")
			setCode("")
			loadMachineTypes()
		} catch (err: any) {
			toast.error(`Gagal menambah tipe mesin: ${err.message}`, { id: toastId })
		} finally {
			setSubmitLoading(false)
		}
	}

	const handleOpenEdit = (mType: MachineType) => {
		setSelectedMachineType(mType)
		setName(mType.name)
		setCode(mType.code)
		setIsEditOpen(true)
	}

	const handleUpdate = async () => {
		if (!selectedMachineType) return
		if (!name || !code) {
			toast.error("Silakan isi nama dan kode tipe mesin")
			return
		}
		setSubmitLoading(true)
		const toastId = toast.loading("Memperbarui tipe mesin...")
		try {
			await machineTypeService.update(selectedMachineType.id, name, code)
			toast.success("Tipe mesin berhasil diperbarui!", { id: toastId })
			setIsEditOpen(false)
			setSelectedMachineType(null)
			setName("")
			setCode("")
			loadMachineTypes()
		} catch (err: any) {
			toast.error(`Gagal memperbarui tipe mesin: ${err.message}`, { id: toastId })
		} finally {
			setSubmitLoading(false)
		}
	}

	const handleDelete = async (id: string) => {
		if (!confirm("Apakah Anda yakin ingin menghapus tipe mesin ini?")) return
		const toastId = toast.loading("Menghapus tipe mesin...")
		try {
			await machineTypeService.delete(id)
			toast.success("Tipe mesin berhasil dihapus!", { id: toastId })
			loadMachineTypes()
		} catch (err: any) {
			toast.error(`Gagal menghapus tipe mesin: ${err.message}`, { id: toastId })
		}
	}

	const filtered = machineTypes.filter(
		(m) =>
			m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			m.code.toLowerCase().includes(searchQuery.toLowerCase())
	)

	return (
		<div className="space-y-6">
			<div className="space-y-4">
				<div className="text-sm text-gray-500 flex items-center gap-2">
					Home <span className="text-gray-300">/</span> Master Data <span className="text-gray-300">/</span> <span className="text-gray-900 font-medium">Tipe Mesin</span>
				</div>

				<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div className="space-y-1">
						<h1 className="text-2xl font-bold text-gray-900 tracking-tight">Manajemen Tipe Mesin</h1>
						<p className="text-gray-500 text-sm">Kelola data kategori dan tipe mesin operasional di pabrik PT. Greenfields Indonesia.</p>
					</div>

					<div className="flex items-center gap-2">
						<Button variant="outline" onClick={handleRefresh} disabled={refreshing} className="h-11 border-gray-200 hover:bg-gray-50 bg-white">
							<RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
							Refresh
						</Button>

						{isSupervisor && (
							<Button onClick={() => { setName(""); setCode(""); setIsFormOpen(true) }} className="gap-2 text-white h-11 bg-emerald-600 hover:bg-emerald-700 font-semibold cursor-pointer shadow-md shadow-emerald-100">
								<Plus className="h-4 w-4" /> Tambah Tipe Mesin
							</Button>
						)}
					</div>
				</div>

				<div className="relative w-full">
					<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
					<Input placeholder="Cari tipe mesin berdasarkan nama atau kode..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-11 h-12 bg-white border-gray-200 focus-visible:ring-emerald-500 focus-visible:ring-1" />
				</div>
			</div>

			<ResponsiveModal
				open={isFormOpen}
				onOpenChange={setIsFormOpen}
				showCloseButton={false}
				title="Tambah Tipe Mesin Baru"
				footer={
					<div className="flex gap-3 w-full">
						<Button onClick={handleCreate} disabled={submitLoading} className="flex-1 h-11 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 cursor-pointer">
							{submitLoading ? "Menyimpan..." : "Simpan Tipe Mesin"}
						</Button>
						<Button variant="outline" onClick={() => setIsFormOpen(false)} className="flex-1 h-11 border-gray-200 hover:bg-gray-100 cursor-pointer">Batal</Button>
					</div>
				}
			>
				<div className="space-y-4 py-2">
					<div className="space-y-1.5">
						<Label htmlFor="mName" className="text-sm font-semibold text-gray-700">Nama Tipe Mesin</Label>
						<Input id="mName" placeholder="Contoh: Pasteurizer / Homogenizer" value={name} onChange={(e) => setName(e.target.value)} className="h-11 bg-white border-gray-200" />
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="mCode" className="text-sm font-semibold text-gray-700">Kode Tipe Mesin</Label>
						<Input id="mCode" placeholder="Contoh: PST / HMG" value={code} onChange={(e) => setCode(e.target.value)} className="h-11 bg-white border-gray-200" />
					</div>
				</div>
			</ResponsiveModal>

			<ResponsiveModal
				open={isEditOpen}
				onOpenChange={setIsEditOpen}
				showCloseButton={false}
				title="Edit Data Tipe Mesin"
				footer={
					<div className="flex gap-3 w-full">
						<Button onClick={handleUpdate} disabled={submitLoading} className="flex-1 h-11 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 cursor-pointer">
							{submitLoading ? "Menyimpan..." : "Simpan Perubahan"}
						</Button>
						<Button variant="outline" onClick={() => { setIsEditOpen(false); setSelectedMachineType(null) }} className="flex-1 h-11 border-gray-200 hover:bg-gray-100 cursor-pointer">Batal</Button>
					</div>
				}
			>
				<div className="space-y-4 py-2">
					<div className="space-y-1.5">
						<Label htmlFor="editMName" className="text-sm font-semibold text-gray-700">Nama Tipe Mesin</Label>
						<Input id="editMName" placeholder="Contoh: Pasteurizer / Homogenizer" value={name} onChange={(e) => setName(e.target.value)} className="h-11 bg-white border-gray-200" />
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="editMCode" className="text-sm font-semibold text-gray-700">Kode Tipe Mesin</Label>
						<Input id="editMCode" placeholder="Contoh: PST / HMG" value={code} onChange={(e) => setCode(e.target.value)} className="h-11 bg-white border-gray-200" />
					</div>
				</div>
			</ResponsiveModal>

			{loading ? (
				<div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
					<RefreshCw className="h-8 w-8 text-emerald-500 animate-spin mb-4" />
					<p className="text-gray-500 font-medium">Memuat data tipe mesin...</p>
				</div>
			) : filtered.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
					<div className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center mb-4"><Settings className="h-6 w-6 text-gray-300" /></div>
					<p className="text-gray-500 font-medium">Tidak ada tipe mesin yang ditemukan.</p>
				</div>
			) : (
				<div className="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-200/80 shadow-md overflow-hidden">
					<div className="overflow-x-auto">
						<table className="w-full text-sm text-left">
							<thead className="bg-gray-50/50 text-gray-400 font-semibold border-b border-gray-200/50 uppercase text-[10px] tracking-wider">
								<tr>
									<th className="px-6 py-4">Kode Tipe</th>
									<th className="px-6 py-4">Nama Tipe Mesin</th>
									<th className="px-6 py-4">Dibuat Pada</th>
									{isSupervisor && <th className="px-6 py-4 text-center w-[120px]">Aksi</th>}
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-100">
								{filtered.map((m) => (
									<tr key={m.id} className="hover:bg-gray-50/40 transition-colors group">
										<td className="px-6 py-4 font-mono font-bold text-emerald-700 text-xs">{m.code}</td>
										<td className="px-6 py-4 font-semibold text-gray-900 text-sm">{m.name}</td>
										<td className="px-6 py-4 text-gray-500 text-xs">{new Date(m.created_at).toLocaleString("id-ID")}</td>
										{isSupervisor && (
											<td className="px-6 py-4 text-center flex items-center justify-center gap-1">
												<Button variant="ghost" size="icon" onClick={() => handleOpenEdit(m)} className="h-8 w-8 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer">
													<Edit2 className="h-4 w-4" />
												</Button>
												<Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)} className="h-8 w-8 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer">
													<Trash2 className="h-4 w-4" />
												</Button>
											</td>
										)}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</div>
	)
}
