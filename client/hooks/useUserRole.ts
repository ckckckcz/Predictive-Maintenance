import { useState, useEffect } from "react"

export function useUserRole() {
    const [userRole, setUserRole] = useState<string | null>(null)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
        if (typeof window !== "undefined") {
            const userStr = localStorage.getItem("user")
            if (userStr) {
                try {
                    const user = JSON.parse(userStr)
                    setUserRole(user.role)
                    setCurrentUserId(user.id)
                } catch (e) {
                    console.error("Gagal parse data user:", e)
                }
            }
        }
    }, [])

    return { 
        userRole, 
        currentUserId, 
        isMounted, 
        isSupervisor: userRole === "SUPERVISOR" 
    }
}
