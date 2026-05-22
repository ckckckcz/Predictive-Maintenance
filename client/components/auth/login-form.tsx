"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { api } from "@/lib/api"
import toast from "react-hot-toast"

export function LoginForm() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email || !password) {
            toast.error("Silakan isi email dan kata sandi")
            return
        }

        setLoading(true)
        try {
            // Call the login endpoint
            const res = await api.post<any, any>("/api/v1/auth/login", {
                email,
                password,
            })

            // Store credentials in localStorage
            localStorage.setItem("token", res.access_token)
            localStorage.setItem("refreshToken", res.refresh_token)
            localStorage.setItem("user", JSON.stringify(res.user))

            toast.success(`Selamat datang, ${res.user.name}!`)
            
            // Redirect to dashboard with a clean refresh
            window.location.href = "/dashboard"
        } catch (err: any) {
            toast.error(err.message || "Gagal masuk. Periksa kembali email & kata sandi Anda.")
        } finally {
            setLoading(false)
        }
    }

    // Auto-redirect if already authenticated
    useEffect(() => {
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("token")
            if (token) {
                router.replace("/dashboard")
            }
        }
    }, [router])

    return (
        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white h-full w-full">
            <div className="mx-auto grid w-full max-w-[400px] gap-6">
                <div className="grid gap-2 text-left">
                    <div className="flex items-center gap-2 mb-2 h-18 bg-gray-100 rounded-lg p-2 w-36">
                        <Image
                            src="/greenfields.png"
                            alt="Greenfields Logo"
                            width={120}
                            height={30}
                            className="w-32 h-auto"
                        />
                    </div>

                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                        Selamat Datang
                    </h1>

                    <p className="text-balance text-gray-500">
                        Selamat datang kembali! Silakan masukkan detail Anda.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="Masukkan email Anda"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                            className="bg-gray-50 border-gray-200"
                            required
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password">
                            Kata Sandi
                        </Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            className="bg-gray-50 border-gray-200"
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-700 hover:bg-green-800 h-11 font-medium cursor-pointer"
                    >
                        {loading ? "Memproses..." : "Masuk"}
                    </Button>
                </form>
            </div>
        </div>
    )
}