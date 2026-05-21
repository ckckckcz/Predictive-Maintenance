"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    House,
    Database,
    Users,
    Clock,
    Factory,
    ChevronDown,
    ChevronRight,
    Cog,
    Clipboard
} from "lucide-react"

import { useState } from "react"
import { cn } from "@/lib/utils"
import Image from "next/image"

export function Sidebar({ className }: { className?: string }) {
    const pathname = usePathname()

    const [isMasterDataOpen, setIsMasterDataOpen] = useState(true)

    const toggleMasterData = () => {
        setIsMasterDataOpen(!isMasterDataOpen)
    }

    return (
        <div
            className={cn(
                "h-screen bg-gray-50 border-r border-gray-200",
                className
            )}
        >
            <div className="py-6">
                {/* Logo */}
                <div className="px-4 mb-6">
                    <Image
                        src="/greenfields.png"
                        alt="Greenfields"
                        width={140}
                        height={40}
                        className="w-32 h-auto"
                        priority
                    />
                </div>

                {/* Menu */}
                <div className="px-3">
                    <h2 className="mb-2 text-xs font-semibold tracking-tight text-gray-500 uppercase">
                        Menu
                    </h2>

                    {/* Home */}
                    <Link href="/dashboard">
                        <span
                            className={cn(
                                "flex items-center rounded-lg px-3 py-2 mb-1 text-sm font-semibold cursor-pointer transition-colors hover:bg-green-50 hover:text-green-700",
                                pathname === "/dashboard"
                                    ? "bg-green-50 text-green-700"
                                    : "text-gray-700"
                            )}
                        >
                            <House className="mr-3 h-4 w-4" />
                            Home
                        </span>
                    </Link>

                    {/* Operations */}
                    <Link href="/dashboard/operations">
                        <span
                            className={cn(
                                "flex items-center rounded-lg px-3 py-2 mb-1 text-sm font-semibold cursor-pointer transition-colors hover:bg-green-50 hover:text-green-700",
                                pathname === "/dashboard/operations"
                                    ? "bg-green-50 text-green-700"
                                    : "text-gray-700"
                            )}
                        >
                            <Cog className="mr-3 h-4 w-4" />
                            Operations
                        </span>
                    </Link>
                    
                    {/* Audit */}
                    <Link href="/dashboard/audit">
                        <span
                            className={cn(
                                "flex items-center rounded-lg px-3 py-2 mb-1 text-sm font-semibold cursor-pointer transition-colors hover:bg-green-50 hover:text-green-700",
                                pathname === "/dashboard/audit"
                                    ? "bg-green-50 text-green-700"
                                    : "text-gray-700"
                            )}
                        >
                            <Clipboard className="mr-3 h-4 w-4" />
                            Audit
                        </span>
                    </Link>

                    {/* Master Dat */}
                    <div>
                        <button
                            onClick={toggleMasterData}
                            className={cn(
                                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold cursor-pointer transition-colors hover:bg-green-50 hover:text-green-700",
                                isMasterDataOpen
                                    ? "text-green-700"
                                    : "text-gray-700"
                            )}
                        >
                            <div className="flex items-center">
                                <Database className="mr-3 h-4 w-4" />
                                Master Data
                            </div>

                            {isMasterDataOpen ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronRight className="h-4 w-4" />
                            )}
                        </button>

                        {/* Submenu */}
                        {isMasterDataOpen && (
                            <div className="relative ml-6 mt-1">
                                {/* Vertical Line */}
                                <div className="absolute left-0 top-0 bottom-3 w-px bg-gray-200"></div>

                                {[
                                    {
                                        href: "/dashboard/groups",
                                        label: "Groups",
                                        icon: Users,
                                    },
                                    {
                                        href: "/dashboard/shifts",
                                        label: "Shifts",
                                        icon: Clock,
                                    },
                                    {
                                        href: "/dashboard/production-lines",
                                        label: "Production Lines",
                                        icon: Factory,
                                    },
                                ].map((item) => (
                                    <div
                                        key={item.href}
                                        className="relative"
                                    >
                                        <Link
                                            href={item.href}
                                            className="flex items-center h-9 pl-8 text-sm font-medium text-gray-600 hover:text-green-700 transition-colors"
                                        >
                                            {/* Curve Line */}
                                            <div className="absolute left-0 top-0 h-[18px] w-5 border-l border-b border-gray-200 rounded-bl-xl"></div>

                                            <span
                                                className={cn(
                                                    "transition-colors",
                                                    pathname === item.href
                                                        ? "text-green-700 font-semibold"
                                                        : ""
                                                )}
                                            >
                                                {item.label}
                                            </span>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}