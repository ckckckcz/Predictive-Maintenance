"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const [authorized, setAuthorized] = useState(false)

    useEffect(() => {
        const token = localStorage.getItem("token")
        if (!token) {
            router.replace("/login")
        } else {
            setAuthorized(true)
        }
    }, [router])

    if (!authorized) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                    <p className="text-sm font-semibold text-gray-500 animate-pulse">
                        Memuat data otentikasi...
                    </p>
                </div>
            </div>
        )
    }

    return <>{children}</>
}
