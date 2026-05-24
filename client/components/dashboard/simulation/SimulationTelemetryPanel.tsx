import { ShieldAlert, Info, XCircle, Lock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Machine, SensorReading } from "@/types/machine"

interface SimulationTelemetryPanelProps {
    selectedMachine: Machine
    latestReading?: SensorReading
    simulating: boolean
    userRole: string | null
    onSimulateAnomaly: () => void
    onToggleStatus: () => void
}

export function SimulationTelemetryPanel({
    selectedMachine,
    latestReading,
    simulating,
    userRole,
    onSimulateAnomaly,
    onToggleStatus,
}: SimulationTelemetryPanelProps) {
    const isSupervisor = userRole === "SUPERVISOR"

    return (
        <Card className="shadow-sm border-gray-200">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <CardTitle className="text-xl font-extrabold text-gray-900">
                            {selectedMachine.name}
                        </CardTitle>
                        <Badge variant={selectedMachine.status === "ACTIVE" ? "success" : "warning"}>
                            {selectedMachine.status}
                        </Badge>
                    </div>
                    <CardDescription className="mt-1">
                        Tipe: <span className="font-semibold text-gray-700">{selectedMachine.type}</span> | Area: <span className="font-semibold text-gray-700">{selectedMachine.location || "Area A"}</span>
                    </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {selectedMachine.status === "ACTIVE" && (
                        <Button
                            onClick={onSimulateAnomaly}
                            disabled={simulating}
                            className="bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center gap-2 rounded-xl transition-all duration-200 shadow-sm text-xs cursor-pointer h-9 px-3.5"
                        >
                            <ShieldAlert className={`h-4 w-4 ${simulating ? "animate-spin" : ""}`} />
                            {simulating ? "Simulating Anomaly..." : "Simulasikan Anomali"}
                        </Button>
                    )}
                    <div className="text-xs text-gray-500 bg-gray-50 p-2.5 rounded-lg border border-gray-100 flex items-center gap-1">
                        <Info className="h-4 w-4 text-green-700 inline shrink-0" />
                        Menerima log baru setiap 15 detik secara background.
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                {selectedMachine.status !== "ACTIVE" ? (
                    <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-gray-50 border border-dashed border-gray-200 rounded-xl">
                        <XCircle className="h-10 w-10 text-gray-400" />
                        <h3 className="mt-3 font-bold text-gray-800">Mesin Dinonaktifkan</h3>
                        <p className="text-sm text-gray-500 max-w-sm mt-1">
                            Mesin ini dalam keadaan mati. Hubungkan daya menggunakan switch di panel kiri untuk mensimulasikan pembacaan telemetry.
                        </p>
                        {isSupervisor ? (
                            <Button
                                onClick={onToggleStatus}
                                className="mt-4 bg-green-700 hover:bg-green-800 text-xs font-semibold h-9"
                            >
                                Nyalakan Daya Sekarang
                            </Button>
                        ) : (
                            <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-400 bg-gray-100/50 px-3 py-1.5 rounded-lg">
                                <Lock className="h-3.5 w-3.5" /> Butuh Supervisor Role untuk menyalakan daya
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                        {/* Temperature */}
                        {(selectedMachine.code === "PST-001" ||
                            selectedMachine.code === "CLD-003" ||
                            selectedMachine.code === "BLR-001") && (
                                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200/60 shadow-sm relative overflow-hidden">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block">Temperatur</span>
                                    <span className="text-2xl font-extrabold text-gray-900 mt-1 block">
                                        {latestReading?.temperature ? `${latestReading.temperature.toFixed(1)}°C` : "N/A"}
                                    </span>
                                    <span className="text-[10px] text-gray-400 mt-1 block font-medium">
                                        Normal: {selectedMachine.code === "PST-001" ? "72-75°C" : selectedMachine.code === "CLD-003" ? "2-4°C" : "90-110°C"}
                                    </span>
                                </div>
                            )}

                        {/* Vibration */}
                        {selectedMachine.code === "FLL-002" && (
                            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200/60 shadow-sm relative overflow-hidden">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block">Getaran</span>
                                <span className="text-2xl font-extrabold text-gray-900 mt-1 block">
                                    {latestReading?.vibration ? `${latestReading.vibration.toFixed(2)} Hz` : "N/A"}
                                </span>
                                <span className="text-[10px] text-gray-400 mt-1 block font-medium">
                                    Normal: &lt; 2.5Hz
                                </span>
                            </div>
                        )}

                        {/* Pressure */}
                        {(selectedMachine.code === "CNV-001" || selectedMachine.code === "BLR-001") && (
                            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200/60 shadow-sm relative overflow-hidden">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block">Tekanan</span>
                                <span className="text-2xl font-extrabold text-gray-900 mt-1 block">
                                    {latestReading?.pressure ? `${latestReading.pressure.toFixed(2)} Bar` : "N/A"}
                                </span>
                                <span className="text-[10px] text-gray-400 mt-1 block font-medium">
                                    Normal: {selectedMachine.code === "CNV-001" ? "1.5-4.0 Bar" : "2.0-6.0 Bar"}
                                </span>
                            </div>
                        )}

                        {/* RPM */}
                        {selectedMachine.code === "CNV-001" && (
                            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200/60 shadow-sm relative overflow-hidden">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block">RPM</span>
                                <span className="text-2xl font-extrabold text-gray-900 mt-1 block">
                                    {latestReading?.rpm ? `${latestReading.rpm}` : "N/A"}
                                </span>
                                <span className="text-[10px] text-gray-400 mt-1 block font-medium">
                                    Normal: 800-1200
                                </span>
                            </div>
                        )}

                        {/* Efficiency */}
                        <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200/60 shadow-sm relative overflow-hidden">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block">Efisiensi</span>
                            <span className={`text-2xl font-extrabold mt-1 block ${latestReading?.efficiency && latestReading.efficiency < 80 ? "text-amber-600" : "text-gray-900"}`}>
                                {latestReading?.efficiency ? `${latestReading.efficiency.toFixed(0)}%` : "N/A"}
                            </span>
                            <span className="text-[10px] text-gray-400 mt-1 block font-medium">
                                Normal: &gt;= 80%
                            </span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
