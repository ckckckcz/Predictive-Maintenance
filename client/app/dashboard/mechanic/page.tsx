"use client"

import { useState, useEffect } from "react"
import { Plus, Edit2, Trash2, Search, Wrench, RefreshCw, Mail, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ResponsiveModal } from "@/components/dashboard/responsive-modal"
import toast from "react-hot-toast"
import { useUserRole } from "@/hooks/useUserRole"
import { mechanicService } from "@/services/mechanicService"
import { Mechanic } from "@/types/machine"

export default function MechanicPage() {
	const [mechanics, setMechanics] = useState<Mechanic[]>([])
	const [searchQuery, setSearchQuery] = useState("")
	const [loading, setLoading] = useState(true)
	const [refreshing, setRefreshing] = useState(false)
	const { isSupervisor } = useUserRole()

	// Modal & Form states
	const [isFormOpen, setIsFormOpen] = useState(false)
	const [isEditOpen, setIsEditOpen] = useState(false)
	const [selectedMechanic, setSelectedMechanic] = useState<Mechanic | null>(null)
	const [name, setName] = useState("")
	const [email, setEmail] = useState("")
	const [phone, setPhone] = useState("")
	const [specialization, setSpecialization] = useState("")
	const [submitLoading, setSubmitLoading] = useState(false)

	const loadMechanics = async () => {
		try {
			const data = await mechanicService.getAll()
			setMechanics(data || [])
		} catch (err: any) {
			console.error("Gagal memuat mekanik:", err)
			toast.error("Gagal memuat daftar mekanik: " + err.message)
		} finally {
			setLoading(false)
			setRefreshing(false)
		}
	}

	useEffect(() => {
		loadMechanics()
	}, [])

	const handleRefresh = () => {
		setRefreshing(true)
		loadMechanics()
	}

	const handleCreate = async () => {
		if (!name || !email || !phone || !specialization) {
			toast.error("Silakan lengkapi semua bidang form")
			return
		}
		setSubmitLoading(true)
		const toastId = toast.loading("Membuat mekanik baru...")
		try {
			await mechanicService.create({ name, email, phone, specialization })
			toast.success("Mekanik baru berhasil ditambahkan!", { id: toastId })
			setIsFormOpen(false)
			setName(""); setEmail(""); setPhone(""); setSpecialization("")
			loadMechanics()
		} catch (err: any) {
			toast.error(`Gagal menambah mekanik: ${err.message}`, { id: toastId })
		} finally {
			setSubmitLoading(false)
		}
	}

	const handleOpenEdit = (mechanic: Mechanic) => {
		setSelectedMechanic(mechanic)
		setName(mechanic.name)
		setEmail(mechanic.email)
		setPhone(mechanic.phone)
		setSpecialization(mechanic.specialization)
		setIsEditOpen(true)
	}

	const handleUpdate = async () => {
		if (!selectedMechanic) return
		if (!name || !email || !phone || !specialization) {
			toast.error("Silakan lengkapi semua bidang form")
			return
		}
		setSubmitLoading(true)
		const toastId = toast.loading("Memperbarui data mekanik...")
		try {
			await mechanicService.update(selectedMechanic.id, { name, email, phone, specialization })
			toast.success("Data mekanik berhasil diperbarui!", { id: toastId })
			setIsEditOpen(false)
			setSelectedMechanic(null)
			setName(""); setEmail(""); setPhone(""); setSpecialization("")
			loadMechanics()
		} catch (err: any) {
			toast.error(`Gagal memperbarui mekanik: ${err.message}`, { id: toastId })
		} finally {
			setSubmitLoading(false)
		}
	}

	const handleDelete = async (id: string) => {
		if (!confirm("Apakah Anda yakin ingin menghapus data mekanik ini?")) return
		const toastId = toast.loading("Menghapus data mekanik...")
		try {
			await mechanicService.delete(id)
			toast.success("Mekanik berhasil dihapus!", { id: toastId })
			loadMechanics()
		} catch (err: any) {
			toast.error(`Gagal menghapus mekanik: ${err.message}`, { id: toastId })
		}
	}

	const filtered = mechanics.filter(
		(m) =>
			m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
			m.specialization.toLowerCase().includes(searchQuery.toLowerCase())
	)

	return (
		<div className="space-y-6">
			<div className="space-y-4">
				<div className="text-sm text-gray-500 flex items-center gap-2">
					Home <span className="text-gray-300">/</span> Master Data <span className="text-gray-300">/</span> <span className="text-gray-900 font-medium">Mekanik</span>
				</div>

				<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div className="space-y-1">
						<h1 className="text-2xl font-bold text-gray-900 tracking-tight">Manajemen Mekanik & PJ Mesin</h1>
						<p className="text-gray-500 text-sm">Kelola data mekanik dan penanggung jawab (PIC) operasional mesin di PT. Greenfields Indonesia.</p>
					</div>

					<div className="flex items-center gap-2">
						<Button variant="outline" onClick={handleRefresh} disabled={refreshing} className="h-11 border-gray-200 hover:bg-gray-50 bg-white">
							<RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} /> Refresh
						</Button>

						{isSupervisor && (
							<Button onClick={() => { setName(""); setEmail(""); setPhone(""); setSpecialization(""); setIsFormOpen(true) }} className="gap-2 text-white h-11 bg-emerald-600 hover:bg-emerald-700 font-semibold cursor-pointer shadow-md shadow-emerald-100">
								<Plus className="h-4 w-4" /> Tambah Mekanik
							</Button>
						)}
					</div>
				</div>

				<div className="relative w-full">
					<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
					<Input placeholder="Cari mekanik berdasarkan nama, email, atau spesialisasi..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-11 h-12 bg-white border-gray-200 focus-visible:ring-emerald-500 focus-visible:ring-1" />
				</div>
			</div>

			<ResponsiveModal
				open={isFormOpen}
				onOpenChange={setIsFormOpen}
				showCloseButton={false}
				title="Tambah Mekanik Baru"
				footer={
					<div className="flex gap-3 w-full">
						<Button onClick={handleCreate} disabled={submitLoading} className="flex-1 h-11 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 cursor-pointer">{submitLoading ? "Menyimpan..." : "Simpan Mekanik"}</Button>
						<Button variant="outline" onClick={() => setIsFormOpen(false)} className="flex-1 h-11 border-gray-200 hover:bg-gray-100 cursor-pointer">Batal</Button>
					</div>
				}
			>
				<div className="space-y-4 py-2">
					<div className="space-y-1.5">
						<Label htmlFor="mName" className="text-sm font-semibold text-gray-700">Nama Lengkap</Label>
						<Input id="mName" placeholder="Contoh: Budi Santoso" value={name} onChange={(e) => setName(e.target.value)} className="h-11 bg-white border-gray-200" />
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="mEmail" className="text-sm font-semibold text-gray-700">Alamat Email</Label>
						<Input id="mEmail" type="email" placeholder="Contoh: budi.santoso@greenfields.id" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 bg-white border-gray-200" />
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="mPhone" className="text-sm font-semibold text-gray-700">Nomor Telepon</Label>
						<Input id="mPhone" placeholder="Contoh: 08123456789" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-11 bg-white border-gray-200" />
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="mSpec" className="text-sm font-semibold text-gray-700">Spesialisasi</Label>
						<Input id="mSpec" placeholder="Contoh: Electrical, Mechanical, Thermal" value={specialization} onChange={(e) => setSpecialization(e.target.value)} className="h-11 bg-white border-gray-200" />
					</div>
				</div>
			</ResponsiveModal>

			<ResponsiveModal
				open={isEditOpen}
				onOpenChange={setIsEditOpen}
				showCloseButton={false}
				title="Edit Data Mekanik"
				footer={
					<div className="flex gap-3 w-full">
						<Button onClick={handleUpdate} disabled={submitLoading} className="flex-1 h-11 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 cursor-pointer">{submitLoading ? "Menyimpan..." : "Simpan Perubahan"}</Button>
						<Button variant="outline" onClick={() => { setIsEditOpen(false); setSelectedMechanic(null) }} className="flex-1 h-11 border-gray-200 hover:bg-gray-100 cursor-pointer">Batal</Button>
					</div>
				}
			>
				<div className="space-y-4 py-2">
					<div className="space-y-1.5">
						<Label htmlFor="editMName" className="text-sm font-semibold text-gray-700">Nama Lengkap</Label>
						<Input id="editMName" placeholder="Contoh: Budi Santoso" value={name} onChange={(e) => setName(e.target.value)} className="h-11 bg-white border-gray-200" />
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="editMEmail" className="text-sm font-semibold text-gray-700">Alamat Email</Label>
						<Input id="editMEmail" type="email" placeholder="Contoh: budi.santoso@greenfields.id" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 bg-white border-gray-200" />
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="editMPhone" className="text-sm font-semibold text-gray-700">Nomor Telepon</Label>
						<Input id="editMPhone" placeholder="Contoh: 08123456789" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-11 bg-white border-gray-200" />
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="editMSpec" className="text-sm font-semibold text-gray-700">Spesialisasi</Label>
						<Input id="editMSpec" placeholder="Contoh: Electrical, Mechanical, Thermal" value={specialization} onChange={(e) => setSpecialization(e.target.value)} className="h-11 bg-white border-gray-200" />
					</div>
				</div>
			</ResponsiveModal>

			{loading ? (
				<div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
					<RefreshCw className="h-8 w-8 text-emerald-500 animate-spin mb-4" />
					<p className="text-gray-500 font-medium">Memuat data mekanik...</p>
				</div>
			) : filtered.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
					<div className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center mb-4"><Wrench className="h-6 w-6 text-gray-300" /></div>
					<p className="text-gray-500 font-medium">Tidak ada mekanik yang ditemukan.</p>
				</div>
			) : (
				<div className="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-200/80 shadow-md overflow-hidden">
					<div className="overflow-x-auto">
						<table className="w-full text-sm text-left">
							<thead className="bg-gray-50/50 text-gray-400 font-semibold border-b border-gray-200/50 uppercase text-[10px] tracking-wider">
								<tr>
									<th className="px-6 py-4">Nama Mekanik</th>
									<th className="px-6 py-4">Spesialisasi</th>
									<th className="px-6 py-4">Email</th>
									<th className="px-6 py-4">Telepon</th>
									<th className="px-6 py-4">Dibuat Pada</th>
									{isSupervisor && <th className="px-6 py-4 text-center w-[120px]">Aksi</th>}
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-100">
								{filtered.map((m) => (
									<tr key={m.id} className="hover:bg-gray-50/40 transition-colors group">
										<td className="px-6 py-4 font-semibold text-gray-900 text-sm">
											<div className="flex items-center gap-2">
												<div className="h-8 w-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs uppercase">{m.name.substring(0, 2)}</div>
												<span>{m.name}</span>
											</div>
										</td>
										<td className="px-6 py-4">
											<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800">{m.specialization}</span>
										</td>
										<td className="px-6 py-4 text-gray-600 text-sm">
											<div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-gray-400" /><span>{m.email}</span></div>
										</td>
										<td className="px-6 py-4 text-gray-600 text-sm font-mono">
											<div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-gray-400" /><span>{m.phone}</span></div>
										</td>
										<td className="px-6 py-4 text-gray-500 text-xs">{m.created_at ? new Date(m.created_at).toLocaleString("id-ID") : "-"}</td>
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
