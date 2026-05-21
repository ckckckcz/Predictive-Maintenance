"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"

export function LoginForm() {
    return (
        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white h-full w-full">
            <div className="mx-auto grid w-full max-w-[400px] gap-6">
                <div className="grid gap-2 text-left">
                    <div className="flex items-center gap-2 mb-2 h-18 bg-gray-100 rounded-lg p-2 w-36">
                        <Image
                            src="/greenfields.png"
                            alt=""
                            width={1920}
                            height={1080}
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

                <form className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>

                        <Input
                            id="email"
                            type="email"
                            placeholder="Masukkan email Anda"
                            className="bg-gray-50 border-gray-200"
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
                            className="bg-gray-50 border-gray-200"
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-green-700 hover:bg-green-800 h-11 font-medium cursor-pointer"
                    >
                        Masuk
                    </Button>
                </form>
            </div>
        </div>
    )
}