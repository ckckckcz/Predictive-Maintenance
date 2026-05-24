import { api } from "@/lib/api"
import { AuditLog, IncidentReply, IncidentWithDetails } from "@/types/audit"
import { Incident } from "@/types/machine"

export const auditService = {
    getAuditLogs: async () => {
        return api.get<any, AuditLog[]>("/api/v1/audit-logs")
    },
    getIncidents: async (params?: { limit?: number; machine_id?: string }) => {
        let url = "/api/v1/incidents"
        const queryParams = new URLSearchParams()
        if (params?.limit) queryParams.append("limit", params.limit.toString())
        if (params?.machine_id) queryParams.append("machine_id", params.machine_id)
        
        const queryString = queryParams.toString()
        if (queryString) {
            url += `?${queryString}`
        }
        
        return api.get<any, IncidentWithDetails[]>(url)
    },
    getReplies: async (incidentId: string) => {
        return api.get<any, IncidentReply[]>(`/api/v1/incidents/${incidentId}/replies`)
    },
    sendReply: async (incidentId: string, payload: { message: string; status?: string }) => {
        return api.post<any, IncidentReply>(`/api/v1/incidents/${incidentId}/replies`, payload)
    },
    acknowledgeIncident: async (incidentId: string) => {
        return api.post(`/api/v1/incidents/${incidentId}/acknowledge`)
    },
    resolveIncident: async (incidentId: string) => {
        return api.post(`/api/v1/incidents/${incidentId}/resolve`)
    }
}
