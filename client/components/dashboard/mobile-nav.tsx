"use client"

import { Menu, X } from "lucide-react"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Sidebar } from "./sidebar"
import { Button } from "@/components/ui/button"

export function MobileNav() {
    const [open, setOpen] = useState(false)
    const pathname = usePathname()

    useEffect(() => {
        setOpen(false)
    }, [pathname])

    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [open])

    return (
        <div className="lg:hidden">
            <Button
                variant="ghost"
                size="icon"
                className="mr-2 px-0 hover:bg-transparent"
                onClick={() => setOpen(true)}
            >
                <Menu className="h-6 w-6 text-gray-700" />
                <span className="sr-only">Toggle menu</span>
            </Button>

            {open && (
                <div className="fixed inset-0 z-50 flex">
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in"
                        onClick={() => setOpen(false)}
                    />

                    <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white pt-5 pb-4 animate-in slide-in-from-left duration-300">
                        <div className="absolute top-0 right-0 -mr-12 pt-2">
                            <button
                                type="button"
                                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                                onClick={() => setOpen(false)}
                            >
                                <span className="sr-only">Close sidebar</span>
                                <X className="h-6 w-6 text-white" aria-hidden="true" />
                            </button>
                        </div>

                        <div className="flex-1 h-full overflow-y-auto">
                            <Sidebar className="border-none bg-white min-h-0" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
