"use client";

import { useState } from "react";
import { Bell, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    return (
        <>
            <div className="fixed top-0 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-7xl">
                <div className="bg-white border border-gray-200 rounded-br-xl rounded-bl-xl h-[60px] flex items-center justify-between px-3 shadow-lg">
                    {/* Left: Logo */}
                    <div className="flex items-center pl-4">
                        <div className="hidden">PT. Greenfields Indonesia</div>
                    </div>

                    {/* Real Logo Vector */}
                    <div className="pl-4 absolute left-3">
                        <Image src="/greenfields.png" alt="Greenfields" width={1920} height={1080} className="w-auto h-6" />
                    </div>

                    {/* Center: Navigation (Desktop Only) */}
                    <nav className="hidden md:flex items-center gap-10 text-[14px] text-gray-500 font-medium z-10">
                        <Link href="/dokumentasi"><button className="cursor-pointer hover:text-[#111111] transition-colors">Dokumentasi</button></Link>
                        <Link href="/download"><button className="cursor-pointer hover:text-[#111111] transition-colors">Download Aplikasi</button></Link>
                    </nav>

                    {/* Right: Actions (Desktop Only) */}
                    <div className="hidden md:flex items-center relative">
                        {!isAuthenticated ? (
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Button
                                        variant="outline"
                                        className="h-[40px] px-5 rounded-md cursor-pointer text-[14px] font-medium hover:bg-gray-200 cursor-pointer transition-all relative z-10"
                                        onClick={() => setIsAuthenticated(true)}
                                    >
                                        Login
                                    </Button>
                                    <div className="hidden lg:flex absolute left-1/2 -translate-x-[65%] -bottom-[50px] pointer-events-none flex-row items-start z-40">
                                        <span className="text-green-700 font-serif italic text-[16px] whitespace-nowrap font-medium -rotate-[3deg] mt-[20px] mr-1">
                                            I'm ready to work
                                        </span>
                                        <svg width="50" height="55" viewBox="0 0 100 100" fill="none" stroke="#388E3C" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" className="-translate-y-2">
                                            <path d="M 5,80 C 40,110 130,50 65,15" />
                                            <path d="M 90,12 L 65,15 L 75,40" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="bg-gray-50 border border-gray-100 rounded-full h-[46px] flex items-center px-[6px] gap-3 shadow-sm">
                                    <button
                                        className="pl-2 relative outline-none flex items-center justify-center p-1 rounded-full hover:bg-gray-200 transition-colors"
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    >
                                        <Bell className="w-[18px] h-[18px] text-[#333]" strokeWidth={2.5} />
                                        <div className="absolute top-[3px] right-[4px] w-[6px] h-[6px] bg-[#2563eb] rounded-full border border-gray-50" />
                                    </button>
                                    <div
                                        className="w-[34px] h-[34px] rounded-full overflow-hidden cursor-pointer bg-gray-200 border-2 border-transparent hover:border-[#2563eb] transition-colors"
                                        onClick={() => setIsAuthenticated(false)}
                                        title="Logout Demo"
                                    >
                                        <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop" alt="avatar" className="w-full h-full object-cover" />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Mobile Hamburger Button */}
                    <button
                        className="md:hidden flex items-center justify-center p-3 pr-4 z-10"
                        onClick={() => setIsMobileMenuOpen(true)}
                    >
                        <div className="flex flex-col gap-[3.5px] items-center relative">
                            <div className="w-[18px] h-[1.8px] bg-[#111111] rounded-full"></div>
                            <div className="w-[18px] h-[1.8px] bg-[#111111] rounded-full"></div>
                        </div>
                    </button>
                </div>
            </div>

            {/* Mobile Fullscreen Menu */}
            <div
                className={`fixed inset-0 z-[100] bg-white transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:hidden flex flex-col p-6 overflow-hidden transform ${isMobileMenuOpen ? "translate-y-0 opacity-100 pointer-events-auto" : "-translate-y-full opacity-0 pointer-events-none"}`}
            >
                {/* Top Header */}
                <div className="flex justify-between items-center mb-12 mt-4">
                    <span className="text-gray-500 text-[15px] font-medium">Menu</span>
                    <div
                        className="flex items-center gap-2 cursor-pointer group"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        <span className="text-gray-500 text-[13px] font-medium group-hover:text-[#111111] transition-colors">Close</span>
                        <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center group-hover:border-gray-400 group-hover:bg-gray-50 transition-all">
                            <X className="w-4 h-4 text-[#111111]" />
                        </div>
                    </div>
                </div>

                {/* Middle: Large Navigation Links */}
                <nav className="flex flex-col gap-6 text-[36px] font-medium text-[#111111] flex-1 overflow-y-auto mt-4">
                    <button className="text-left hover:text-gray-600 transition-colors">Dokumentasi</button>
                    <button className="text-left hover:text-gray-600 transition-colors">Download Aplikasi</button>
                </nav>

                {/* Bottom: Contact & Social Info */}
                <div className="mt-8 flex justify-between items-end pb-4 pt-6 border-t border-gray-100">
                    {/* Left: Contact Info */}
                    <div className="flex flex-col gap-2">
                        <Link href="/login" className="text-gray-500 text-xl hover:text-[#111111] underline underline-offset-4 decoration-gray-300 hover:decoration-[#111111] transition-all">
                            Masuk
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
