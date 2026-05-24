import { api } from "@/lib/api"
import { MachineType } from "@/types/machine-type"

export const machineTypeService = {
    getAll: async () => {
        return api.get<any, MachineType[]>("/api/v1/machine-types")
    },
    create: async (name: string, code: string) => {
        return api.post("/api/v1/machine-types", { name, code })
    },
    update: async (id: string, name: string, code: string) => {
        return api.put(`/api/v1/machine-types/${id}`, { name, code })
    },
    delete: async (id: string) => {
        return api.delete(`/api/v1/machine-types/${id}`)
    }
}
