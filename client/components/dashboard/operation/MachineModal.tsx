import { ResponsiveModal } from "@/components/dashboard/responsive-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Mechanic } from "@/types/machine"

interface MachineModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    name: string
    setName: (val: string) => void
    code: string
    setCode: (val: string) => void
    type: string
    setType: (val: string) => void
    location: string
    setLocation: (val: string) => void
    mechanicId: string
    setMechanicId: (val: string) => void
    submitLoading: boolean
    onSubmit: () => void
    areas: { id: string; name: string; code: string }[]
    machineTypes: { id: string; name: string; code: string }[]
    mechanics: Mechanic[]
}

export function MachineModal({
    open,
    onOpenChange,
    title,
    name,
    setName,
    code,
    setCode,
    type,
    setType,
    location,
    setLocation,
    mechanicId,
    setMechanicId,
    submitLoading,
    onSubmit,
    areas,
    machineTypes,
    mechanics,
}: MachineModalProps) {
    return (
        <ResponsiveModal
            open={open}
            onOpenChange={onOpenChange}
            showCloseButton={false}
            forceDrawerOnMobile={true}
            title={title}
            footer={
                <div className="flex gap-3 w-full">
                    <Button
                        onClick={onSubmit}
                        disabled={submitLoading}
                        className="flex-1 h-11 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 cursor-pointer"
                    >
                        {submitLoading ? "Menyimpan..." : "Simpan Mesin"}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
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
                        value={name}
                        onChange={(e) => setName(e.target.value)}
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
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="h-11 bg-white border-gray-200"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-gray-700">
                            Tipe Mesin
                        </Label>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger className="h-11 w-full bg-white border-gray-200">
                                <SelectValue placeholder="Pilih Tipe" />
                            </SelectTrigger>
                            <SelectContent>
                                {machineTypes.map((t) => (
                                    <SelectItem key={t.id} value={t.code}>
                                        {t.name} ({t.code})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-gray-700">
                        Lokasi / Area Pabrik
                    </Label>
                    <Select value={location} onValueChange={setLocation}>
                        <SelectTrigger className="h-11 w-full bg-white border-gray-200">
                            <SelectValue placeholder="Pilih Lokasi / Area" />
                        </SelectTrigger>
                        <SelectContent>
                            {areas.map((area) => (
                                <SelectItem key={area.id} value={area.name}>
                                    {area.name} ({area.code})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-gray-700">
                        Penanggung Jawab (Mekanik)
                    </Label>
                    <Select value={mechanicId} onValueChange={setMechanicId}>
                        <SelectTrigger className="h-11 w-full bg-white border-gray-200">
                            <SelectValue placeholder="Pilih Penanggung Jawab (Opsional)" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Belum Ditentukan</SelectItem>
                            {mechanics.map((mech) => (
                                <SelectItem key={mech.id} value={mech.id}>
                                    {mech.name} ({mech.specialization})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </ResponsiveModal>
    )
}
