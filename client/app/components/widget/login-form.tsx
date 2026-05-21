"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { AuthService } from "@/services/auth.service"
import { AlertCircle, Loader2 } from "lucide-react"

export function LoginForm() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    })

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        try {
            const data = await AuthService.login(formData.email, formData.password)

            // Store token and user
            if (typeof window !== 'undefined') {
                localStorage.setItem('token', data.token)
                localStorage.setItem('user', JSON.stringify(data.user))
            }

            // Redirect to dashboard
            router.push("/dashboard")
        } catch (err: any) {
            console.error("Login error", err)
            setError(err.message || "Gagal masuk. Periksa email dan password Anda.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white h-full w-full">
            <div className="mx-auto grid w-full max-w-[400px] gap-6">
                <div className="grid gap-2 text-left">
                    <div className="flex items-center gap-2 mb-2 bg-gray-100 rounded-xl p-2 flex w-36">
                        <Image src="/greenfields.png" alt="" width={1920} height={1080} className="w-32 h-full" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Selamat Datang</h1>
                    <p className="text-balance text-muted-foreground text-gray-500">
                        Selamat datang kembali! Silakan masukkan detail Anda.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="grid gap-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            {error}
                        </div>
                    )}
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="Masukkan email Anda"
                            required
                            className="bg-gray-50 border-gray-200"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            disabled={isLoading}
                        />
                    </div>
                    <div className="grid gap-2">
                        <div className="flex items-center">
                            <Label htmlFor="password">Kata Sandi</Label>
                        </div>
                        <Input
                            id="password"
                            type="password"
                            required
                            placeholder="••••••••"
                            className="bg-gray-50 border-gray-200"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            disabled={isLoading}
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-green-700 hover:bg-green-800 h-11 font-medium cursor-pointer shadow-lg shadow-green-700/20"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Memproses...
                            </>
                        ) : (
                            'Masuk'
                        )}
                    </Button>
                </form>
            </div>
        </div>
    )
}
