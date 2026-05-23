"use client"

import { useState, useEffect } from "react"
import { Plus, Edit2, Trash2, Search, Factory, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ResponsiveModal } from "@/components/dashboard/responsive-modal"
import { Card } from "@/components/ui/card"
import { api } from "@/lib/api"
import toast from "react-hot-toast"

interface Line {
	id: string
	name: string
	code: string
	created_at: string
	updated_at: string
}

export default function LinePage() {
	const [lines, setLines] = useState<Line[]>([])
	const [searchQuery, setSearchQuery] = useState("")
	const [loading, setLoading] = useState(true)
	const [userRole, setUserRole] = useState<string | null>(null)
	const [refreshing, setRefreshing] = useState(false)

	// Modal states
	const [isFormOpen, setIsFormOpen] = useState(false)
	const [isEditOpen, setIsEditOpen] = useState(false)
	const [selectedLine, setSelectedLine] = useState<Line | null>(null)

	// Form states
	const [name, setName] = useState("")
	const [code, setCode] = useState("")
	const [submitLoading, setSubmitLoading] = useState(false)

	const fetchUserRole = () => {
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

	const loadLines = async () => {
		try {
			const data = await api.get<any, Line[]>("/api/v1/lines")
			setLines(data || [])
		} catch (err: any) {
			console.error("Gagal memuat line:", err)
			toast.error("Gagal memuat daftar line: " + err.message)
		} finally {
			setLoading(false)
			setRefreshing(false)
		}
	}

	useEffect(() => {
		fetchUserRole()
		loadLines()
	}, [])

	const handleRefresh = () => {
		setRefreshing(true)
		loadLines()
	}

	const handleCreate = async () => {
		if (!name || !code) {
			toast.error("Silakan isi nama dan kode line")
			return
		}
		setSubmitLoading(true)
		const toastId = toast.loading("Membuat line baru...")
		try {
			await api.post("/api/v1/lines", { name, code })
			toast.success("Line baru berhasil ditambahkan!", { id: toastId })
			setIsFormOpen(false)
			setName("")
			setCode("")
			loadLines()
		} catch (err: any) {
			toast.error(`Gagal menambah line: ${err.message}`, { id: toastId })
		} finally {
			setSubmitLoading(false)
		}
	}

	const handleOpenEdit = (line: Line) => {
		setSelectedLine(line)
		setName(line.name)
		setCode(line.code)
		setIsEditOpen(true)
	}

	const handleUpdate = async () => {
		if (!selectedLine) return
		if (!name || !code) {
			toast.error("Silakan isi nama dan kode line")
			return
		}
		setSubmitLoading(true)
		const toastId = toast.loading("Memperbarui line...")
		try {
			await api.put(`/api/v1/lines/${selectedLine.id}`, { name, code })
			toast.success("Line berhasil diperbarui!", { id: toastId })
			setIsEditOpen(false)
			setSelectedLine(null)
			setName("")
			setCode("")
			loadLines()
		} catch (err: any) {
			toast.error(`Gagal memperbarui line: ${err.message}`, { id: toastId })
		} finally {
			setSubmitLoading(false)
		}
	}

	const handleDelete = async (id: string) => {
		if (!confirm("Apakah Anda yakin ingin menghapus line ini?")) return
		const toastId = toast.loading("Menghapus line...")
		try {
			await api.delete(`/api/v1/lines/${id}`)
			toast.success("Line berhasil dihapus!", { id: toastId })
			loadLines()
		} catch (err: any) {
			toast.error(`Gagal menghapus line: ${err.message}`, { id: toastId })
		}
	}

	const isSupervisor = userRole === "SUPERVISOR"
	const filtered = lines.filter(
		(l) =>
			l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			l.code.toLowerCase().includes(searchQuery.toLowerCase())
	)

	return (
		<div className="space-y-6">
			{/* Breadcrumb & Header */}
			<div className="space-y-4">
				<div className="text-sm text-gray-500 flex items-center gap-2">
					Home <span className="text-gray-300">/</span> Master Data <span className="text-gray-300">/</span> <span className="text-gray-900 font-medium">Line</span>
				</div>

				<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div className="space-y-1">
						<h1 className="text-2xl font-bold text-gray-900 tracking-tight">
							Manajemen Line Produksi
						</h1>
						<p className="text-gray-500 text-sm">
							Kelola data line produksi dan alur pemrosesan di pabrik PT. Greenfields Indonesia.
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
								onClick={() => {
									setName("")
									setCode("")
									setIsFormOpen(true)
								}}
								className="gap-2 text-white h-11 bg-emerald-600 hover:bg-emerald-700 font-semibold cursor-pointer shadow-md shadow-emerald-100"
							>
								<Plus className="h-4 w-4" />
								Tambah Line
							</Button>
						)}
					</div>
				</div>

				{/* Search Bar */}
				<div className="relative w-full">
					<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
					<Input
						placeholder="Cari line berdasarkan nama atau kode..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-11 h-12 bg-white border-gray-200 focus-visible:ring-emerald-500 focus-visible:ring-1"
					/>
				</div>
			</div>

			{/* Modal for Creating Line */}
			<ResponsiveModal
				open={isFormOpen}
				onOpenChange={setIsFormOpen}
				showCloseButton={false}
				title="Tambah Line Baru"
				footer={
					<div className="flex gap-3 w-full">
						<Button
							onClick={handleCreate}
							disabled={submitLoading}
							className="flex-1 h-11 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 cursor-pointer"
						>
							{submitLoading ? "Menyimpan..." : "Simpan Line"}
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
						<Label htmlFor="lName" className="text-sm font-semibold text-gray-700">Nama Line</Label>
						<Input
							id="lName"
							placeholder="Contoh: Line Produksi A"
							value={name}
							onChange={(e) => setName(e.target.value)}
							className="h-11 bg-white border-gray-200"
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="lCode" className="text-sm font-semibold text-gray-700">Kode Line</Label>
						<Input
							id="lCode"
							placeholder="Contoh: LN-A"
							value={code}
							onChange={(e) => setCode(e.target.value)}
							className="h-11 bg-white border-gray-200"
						/>
					</div>
				</div>
			</ResponsiveModal>

			{/* Modal for Editing Line */}
			<ResponsiveModal
				open={isEditOpen}
				onOpenChange={setIsEditOpen}
				showCloseButton={false}
				title="Edit Data Line"
				footer={
					<div className="flex gap-3 w-full">
						<Button
							onClick={handleUpdate}
							disabled={submitLoading}
							className="flex-1 h-11 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 cursor-pointer"
						>
							{submitLoading ? "Menyimpan..." : "Simpan Perubahan"}
						</Button>
						<Button
							variant="outline"
							onClick={() => {
								setIsEditOpen(false)
								setSelectedLine(null)
							}}
							className="flex-1 h-11 border-gray-200 hover:bg-gray-100 cursor-pointer"
						>
							Batal
						</Button>
					</div>
				}
			>
				<div className="space-y-4 py-2">
					<div className="space-y-1.5">
						<Label htmlFor="editLName" className="text-sm font-semibold text-gray-700">Nama Line</Label>
						<Input
							id="editLName"
							placeholder="Contoh: Line Produksi A"
							value={name}
							onChange={(e) => setName(e.target.value)}
							className="h-11 bg-white border-gray-200"
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="editLCode" className="text-sm font-semibold text-gray-700">Kode Line</Label>
						<Input
							id="editLCode"
							placeholder="Contoh: LN-A"
							value={code}
							onChange={(e) => setCode(e.target.value)}
							className="h-11 bg-white border-gray-200"
						/>
					</div>
				</div>
			</ResponsiveModal>

			{/* Content Table / Cards */}
			{loading ? (
				<div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
					<RefreshCw className="h-8 w-8 text-emerald-500 animate-spin mb-4" />
					<p className="text-gray-500 font-medium">Memuat data line...</p>
				</div>
			) : filtered.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
					<div className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center mb-4">
						<Factory className="h-6 w-6 text-gray-300" />
					</div>
					<p className="text-gray-500 font-medium">Tidak ada line yang ditemukan.</p>
				</div>
			) : (
				<div className="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-200/80 shadow-md overflow-hidden">
					<div className="overflow-x-auto">
						<table className="w-full text-sm text-left">
							<thead className="bg-gray-50/50 text-gray-400 font-semibold border-b border-gray-200/50 uppercase text-[10px] tracking-wider">
								<tr>
									<th className="px-6 py-4">Kode Line</th>
									<th className="px-6 py-4">Nama Line</th>
									<th className="px-6 py-4">Dibuat Pada</th>
									{isSupervisor && <th className="px-6 py-4 text-center w-[120px]">Aksi</th>}
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-100">
								{filtered.map((l) => (
									<tr key={l.id} className="hover:bg-gray-50/40 transition-colors group">
										<td className="px-6 py-4 font-mono font-bold text-emerald-700 text-xs">{l.code}</td>
										<td className="px-6 py-4 font-semibold text-gray-900 text-sm">{l.name}</td>
										<td className="px-6 py-4 text-gray-500 text-xs">{new Date(l.created_at).toLocaleString("id-ID")}</td>
										{isSupervisor && (
											<td className="px-6 py-4 text-center flex items-center justify-center gap-1">
												<Button
													variant="ghost"
													size="icon"
													onClick={() => handleOpenEdit(l)}
													className="h-8 w-8 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer"
												>
													<Edit2 className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													onClick={() => handleDelete(l.id)}
													className="h-8 w-8 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
												>
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
