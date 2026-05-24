import { api } from "@/lib/api"
import { Machine, SensorReading } from "@/types/machine"

export interface MachinePayload {
    name: string
    code: string
    type: string
    location: string | null
    mechanic_id: string | null
}

export const machineService = {
    getAll: async () => {
        return api.get<any, Machine[]>("/api/v1/machines")
    },
    create: async (payload: MachinePayload) => {
        return api.post("/api/v1/machines", payload)
    },
    update: async (id: string, payload: MachinePayload) => {
        return api.put(`/api/v1/machines/${id}`, payload)
    },
    delete: async (id: string) => {
        return api.delete(`/api/v1/machines/${id}`)
    },
    toggleStatus: async (id: string, status: "ACTIVE" | "INACTIVE") => {
        return api.patch(`/api/v1/machines/${id}/status`, { status })
    },
    simulateAnomaly: async (id: string) => {
        return api.post(`/api/v1/machines/${id}/simulate-anomaly`)
    },
    getSensorHistory: async (id: string, limit = 30) => {
        return api.get<any, SensorReading[]>(`/api/v1/machines/${id}/sensors/history?limit=${limit}`)
    }
}
