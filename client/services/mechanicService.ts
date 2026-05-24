import { api } from "@/lib/api"
import { Mechanic } from "@/types/machine"

export const mechanicService = {
    getAll: async () => {
        return api.get<any, Mechanic[]>("/api/v1/mechanics")
    },
    create: async (payload: { name: string; email: string; phone: string; specialization: string }) => {
        return api.post("/api/v1/mechanics", payload)
    },
    update: async (id: string, payload: { name: string; email: string; phone: string; specialization: string }) => {
        return api.put(`/api/v1/mechanics/${id}`, payload)
    },
    delete: async (id: string) => {
        return api.delete(`/api/v1/mechanics/${id}`)
    }
}
