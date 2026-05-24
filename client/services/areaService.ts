import { api } from "@/lib/api"
import { Area } from "@/types/area"

export const areaService = {
    getAll: async () => {
        return api.get<any, Area[]>("/api/v1/areas")
    },
    create: async (name: string, code: string) => {
        return api.post("/api/v1/areas", { name, code })
    },
    update: async (id: string, name: string, code: string) => {
        return api.put(`/api/v1/areas/${id}`, { name, code })
    },
    delete: async (id: string) => {
        return api.delete(`/api/v1/areas/${id}`)
    }
}
