import { api } from "@/lib/api"
import { Line } from "@/types/line"

export const lineService = {
    getAll: async () => {
        return api.get<any, Line[]>("/api/v1/lines")
    },
    create: async (name: string, code: string) => {
        return api.post("/api/v1/lines", { name, code })
    },
    update: async (id: string, name: string, code: string) => {
        return api.put(`/api/v1/lines/${id}`, { name, code })
    },
    delete: async (id: string) => {
        return api.delete(`/api/v1/lines/${id}`)
    }
}
