import { Activity, Thermometer, Zap, RefreshCw, Snowflake, Flame } from "lucide-react"
import { Machine, SensorReading } from "@/types/machine"

interface SimulationMachineItemProps {
    m: Machine
    isSelected: boolean
    isActive: boolean
    latestReading?: SensorReading
    userRole: string | null
    onSelect: () => void
    onToggleStatus: () => void
}

export function SimulationMachineItem({
    m,
    isSelected,
    isActive,
    latestReading,
    userRole,
    onSelect,
    onToggleStatus,
}: SimulationMachineItemProps) {
    const getMachineIcon = (code: string, active: boolean) => {
        const colorClass = active ? "text-green-600" : "text-gray-400"
        switch (code) {
            case "PST-001":
                return <Thermometer className={`h-5 w-5 ${colorClass}`} />
            case "FLL-002":
                return <Zap className={`h-5 w-5 ${colorClass}`} />
            case "CNV-001":
                return <RefreshCw className={`h-5 w-5 ${colorClass}`} />
            case "CLD-003":
                return <Snowflake className={`h-5 w-5 ${colorClass}`} />
            case "BLR-001":
                return <Flame className={`h-5 w-5 ${colorClass}`} />
            default:
                return <Activity className={`h-5 w-5 ${colorClass}`} />
        }
    }

    return (
        <div
            onClick={onSelect}
            className={`group relative rounded-xl border p-4 transition-all duration-200 cursor-pointer ${
                isSelected
                    ? "bg-white border-green-600 shadow-md ring-2 ring-green-600/10"
                    : "bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 shadow-sm"
            }`}
        >
            {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-600 rounded-l-xl"></div>}

            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl transition-colors ${isActive ? "bg-green-50" : "bg-gray-100"}`}>
                        {getMachineIcon(m.code, isActive)}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-sm group-hover:text-green-700 transition-colors">
                            {m.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                {m.code}
                            </span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500">{m.location || "Area A"}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={isActive}
                            onChange={onToggleStatus}
                            className="sr-only peer"
                            disabled={userRole !== "SUPERVISOR"}
                        />
                        <div
                            className={`w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600 ${
                                userRole !== "SUPERVISOR" ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                        ></div>
                    </label>
                    <span className={`text-[10px] font-extrabold uppercase tracking-wide ${isActive ? "text-green-600" : "text-gray-400"}`}>
                        {isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>Preview Nilai:</span>
                {isActive ? (
                    <span className="font-semibold text-gray-800 flex gap-2">
                        {m.code === "PST-001" && latestReading?.temperature && (
                            <span>Temp: {latestReading.temperature.toFixed(1)}°C</span>
                        )}
                        {m.code === "FLL-002" && latestReading?.vibration && (
                            <span>Getaran: {latestReading.vibration.toFixed(2)}Hz</span>
                        )}
                        {m.code === "CNV-001" && latestReading?.rpm && latestReading?.pressure && (
                            <>
                                <span>RPM: {latestReading.rpm}</span>
                                <span>Pres: {latestReading.pressure.toFixed(1)}B</span>
                            </>
                        )}
                        {m.code === "CLD-003" && latestReading?.temperature && (
                            <span>Temp: {latestReading.temperature.toFixed(1)}°C</span>
                        )}
                        {m.code === "BLR-001" && latestReading?.temperature && latestReading?.pressure && (
                            <>
                                <span>Temp: {latestReading.temperature.toFixed(1)}°C</span>
                                <span>Pres: {latestReading.pressure.toFixed(1)}B</span>
                            </>
                        )}
                        {latestReading?.efficiency && (
                            <span className="text-green-700">Eff: {latestReading.efficiency.toFixed(0)}%</span>
                        )}
                    </span>
                ) : (
                    <span className="text-gray-400 italic">Mesin Offline</span>
                )}
            </div>
        </div>
    )
}
