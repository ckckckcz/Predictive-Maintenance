export interface AuditLog {
    id: string
    incident_id: string | null
    user_id: string | null
    action: string
    old_value: string | null
    new_value: string | null
    ip_address: string | null
    created_at: string
    actor_name: string | null
}

export interface IncidentReply {
    id: string
    incident_id: string
    user_id: string
    message: string
    created_at: string
    user_name: string
    user_role: string
}

export interface IncidentWithDetails {
    id: string
    machine_id: string
    title: string
    description: string | null
    severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
    status: "OPEN" | "IN_PROGRESS" | "RESOLVED"
    risk_score: number
    created_at: string
    acknowledged_at: string | null
    resolved_at: string | null
    machine_name: string
    machine_code: string
    acknowledged_by_name: string | null
    resolved_by_name: string | null
    supervisor_response?: string | null
}
