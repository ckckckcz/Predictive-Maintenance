"use client"

import { ChevronDown, LogOut } from "lucide-react"
import Image from "next/image"
import { MobileNav } from "./mobile-nav"

export function DashboardHeader() {
    return (
        <header className="sticky top-0 z-40 flex h-16 items-center border-b border-gray-200 bg-white px-4 shadow-sm lg:px-6 justify-between lg:justify-end">
            <MobileNav />

            <div className="flex items-center gap-4">
                <div className="relative">
                    <button
                        className="flex items-center gap-3 pl-4 hover:bg-gray-50 rounded-r-lg transition-colors py-1"
                    >
                        <Image
                            src="https://api.dicebear.com/9.x/lorelei/svg?seed=User"
                            alt="User"
                            width={32}
                            height={32}
                            className="rounded-full bg-gray-100 ring-2 ring-gray-100"
                        />

                        <div className="hidden md:block text-left">
                            <p className="text-sm font-semibold text-gray-900">
                                User
                            </p>

                            <p className="text-xs text-gray-500">
                                production@greenfields.id
                            </p>
                        </div>

                        <ChevronDown className="h-4 w-4 text-gray-500 transition-transform duration-200" />
                    </button>

                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 animate-in fade-in slide-in-from-top-2">
                        <div className="px-4 py-2 border-b border-gray-100 md:hidden">
                            <p className="text-sm font-semibold text-gray-900">
                                User
                            </p>

                            <p className="text-xs text-gray-500">
                                production@greenfields.id
                            </p>
                        </div>

                        <button
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                            <LogOut className="h-4 w-4" />
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </header>
    )
}