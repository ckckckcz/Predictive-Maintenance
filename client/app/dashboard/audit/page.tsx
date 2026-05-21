"use client"

import { useState } from "react"

import {
    Plus,
    Edit2,
    Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ResponsiveModal } from "@/components/dashboard/responsive-modal"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const groups = [
    {
        id: 1,
        name: "Group Alpha",
        status: "Aktif",
    },
    {
        id: 2,
        name: "Group Beta",
        status: "Tidak Aktif",
    },
    {
        id: 3,
        name: "Group Gamma",
        status: "Aktif",
    },
]

export default function GroupsPage() {
    const [isFormOpen, setIsFormOpen] = useState(false)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-gray-800">
                    Manajemen Group
                </h1>

                <Button
                    onClick={() => setIsFormOpen(true)}
                    className="gap-2 text-white bg-green-600 hover:bg-green-700"
                >
                    <Plus className="h-4 w-4" />
                    Tambah Group
                </Button>
            </div>

            {/* Modal */}
            <ResponsiveModal
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                showCloseButton={false}
                forceDrawerOnMobile={true}
                title="Tambah Group"
                footer={
                    <>
                        <Button
                            className="flex-1 h-11 font-semibold bg-green-600 hover:bg-green-700 text-white gap-2"
                        >
                            Simpan
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => setIsFormOpen(false)}
                            className="flex-1 h-11 border-gray-200 hover:bg-gray-100"
                        >
                            Batal
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">
                            Nama Group
                        </Label>

                        <Input
                            placeholder="Contoh: Group Alpha"
                            className="h-11 bg-white border-gray-200 focus:border-green-500 focus:ring-green-500"
                        />

                        <p className="text-xs text-gray-500">
                            Gunakan nama yang mudah dikenali.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">
                            Status Operasional
                        </Label>

                        <Select>
                            <SelectTrigger className="h-11 w-full bg-white border-gray-200 focus:ring-green-500">
                                <SelectValue placeholder="Pilih Status" />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="Aktif">
                                    Aktif
                                </SelectItem>

                                <SelectItem value="Tidak Aktif">
                                    Tidak Aktif
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </ResponsiveModal>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-center">
                        <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3 w-[50px]">
                                    No
                                </th>

                                <th className="px-6 py-3">
                                    Nama Group
                                </th>

                                <th className="px-6 py-3">
                                    Status
                                </th>

                                <th className="px-6 py-3 w-[150px]">
                                    Aksi
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                            {groups.map((group, index) => (
                                <tr
                                    key={group.id}
                                    className="hover:bg-gray-50/50 transition-colors"
                                >
                                    <td className="px-6 py-3 text-gray-500">
                                        {index + 1}
                                    </td>

                                    <td className="px-6 py-3 font-medium text-gray-900">
                                        {group.name}
                                    </td>

                                    <td className="px-6 py-3">
                                        <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                group.status === "Aktif"
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-red-100 text-red-700"
                                            }`}
                                        >
                                            {group.status}
                                        </span>
                                    </td>

                                    <td className="px-6 py-3">
                                        <div className="flex items-center justify-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {groups.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-6 py-8 text-center text-gray-500"
                                    >
                                        Belum ada data group.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}