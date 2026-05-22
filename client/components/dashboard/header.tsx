"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, LogOut } from "lucide-react"
import Image from "next/image"
import { MobileNav } from "./mobile-nav"
import toast from "react-hot-toast"

export function DashboardHeader() {
    const [isOpen, setIsOpen] = useState(false)
    const [user, setUser] = useState<{ name: string; email: string } | null>(null)
    const menuRef = useRef<HTMLDivElement>(null)

    // Load user data from localStorage
    useEffect(() => {
        if (typeof window !== "undefined") {
            const userStr = localStorage.getItem("user")
            if (userStr) {
                try {
                    setUser(JSON.parse(userStr))
                } catch (e) {
                    console.error("Error parsing user from localStorage:", e)
                }
            }
        }
    }, [])

    // Handle click outside to close menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleLogout = () => {
        if (typeof window !== "undefined") {
            localStorage.removeItem("token")
            localStorage.removeItem("refreshToken")
            localStorage.removeItem("user")
            toast.success("Berhasil keluar.")
            window.location.href = "/login"
        }
    }

    return (
        <header className="sticky top-0 z-40 flex h-16 items-center border-b border-gray-200 bg-white px-4 shadow-sm lg:px-6 justify-between lg:justify-end">
            <MobileNav />

            <div className="flex items-center gap-4">
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="flex items-center gap-3 px-3 hover:bg-gray-50 rounded-lg transition-colors py-1.5 cursor-pointer"
                    >
                        <Image
                            src={`https://api.dicebear.com/9.x/lorelei/svg?seed=${user?.name || "User"}`}
                            alt="User"
                            width={32}
                            height={32}
                            className="rounded-full bg-gray-100 ring-2 ring-gray-100"
                        />

                        <div className="hidden md:block text-left">
                            <p className="text-sm font-semibold text-gray-900 leading-none mb-0.5">
                                {user?.name || "User"}
                            </p>

                            <p className="text-xs text-gray-500 leading-none">
                                {user?.email || "production@greenfields.id"}
                            </p>
                        </div>

                        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                    </button>

                    {isOpen && (
                        <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 origin-top-right">
                            <div className="px-4 py-2.5 border-b border-gray-100 md:hidden bg-gray-50/50 rounded-t-xl mb-1">
                                <p className="text-sm font-bold text-gray-900">
                                    {user?.name || "User"}
                                </p>

                                <p className="text-xs text-gray-500 truncate">
                                    {user?.email || "production@greenfields.id"}
                                </p>
                            </div>

                            <button
                                onClick={() => {
                                    setIsOpen(false)
                                    handleLogout()
                                }}
                                className="w-[calc(100%-12px)] mx-1.5 flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors group cursor-pointer text-left"
                            >
                                <LogOut className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}