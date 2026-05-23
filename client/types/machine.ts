export interface Mechanic {
    id: string
    name: string
    email: string
    phone: string
    specialization: string
    created_at?: string
    updated_at?: string
}

export interface Machine {
    id: string
    name: string
    code: string
    type: string
    location: string | null
    status: "ACTIVE" | "INACTIVE" | "MAINTENANCE"
    mechanic_id?: string | null
    mechanic?: Mechanic | null
    created_at: string
}

export interface SensorReading {
    id: string
    machine_id: string
    temperature: number | null
    vibration: number | null
    pressure: number | null
    rpm: number | null
    efficiency: number | null
    is_anomaly: boolean
    read_at: string
}

export interface Incident {
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
}
