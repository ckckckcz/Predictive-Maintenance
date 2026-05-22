import { useState, useEffect, useRef } from "react";
import { Bell, ChevronDown, X, LogOut, LaptopMinimal } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";

export default function Navbar() {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<{ name: string; email: string } | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("token");
            setIsAuthenticated(!!token);
            const userStr = localStorage.getItem("user");
            if (userStr) {
                try {
                    setUser(JSON.parse(userStr));
                } catch (e) {
                    console.error("Error parsing user from localStorage:", e);
                }
            }
        }
    }, []);

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        if (typeof window !== "undefined") {
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("user");
            setIsAuthenticated(false);
            setUser(null);
            toast.success("Berhasil keluar.");
        }
    };

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
                        <Link href="/download"><button className="cursor-pointer hover:text-[#111111] transition-colors">Download App</button></Link>
                    </nav>

                    {/* Right: Actions (Desktop Only) */}
                    <div className="hidden md:flex items-center relative gap-3">
                        {!isAuthenticated ? (
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Link href="/login">
                                        <Button
                                            variant="outline"
                                            className="h-[40px] px-5 rounded-md cursor-pointer text-[14px] font-medium hover:bg-gray-200 cursor-pointer transition-all relative z-10"
                                        >
                                            Login
                                        </Button>
                                    </Link>
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
                            <div className="flex items-center gap-4">
                                <div className="relative" ref={menuRef}>
                                    <button
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className="flex items-center gap-3 px-3 hover:bg-gray-50 rounded-lg transition-colors py-1.5 cursor-pointer"
                                    >
                                        <Image
                                            src={`https://api.dicebear.com/9.x/lorelei/svg?seed=${user?.name || "User"}`}
                                            alt="User"
                                            width={32}
                                            height={32}
                                            className="rounded-full bg-gray-100 ring-2 ring-gray-100"
                                        />

                                        <div className="hidden lg:block text-left">
                                            <p className="text-sm font-semibold text-gray-900 leading-none mb-0.5">
                                                {user?.name || "User"}
                                            </p>

                                            <p className="text-xs text-gray-500 leading-none">
                                                {user?.email || "production@greenfields.id"}
                                            </p>
                                        </div>

                                        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
                                    </button>

                                    {isDropdownOpen && (
                                        <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 origin-top-right">
                                            <div className="px-4 py-2.5 border-b border-gray-100 lg:hidden bg-gray-50/50 rounded-t-xl mb-1">
                                                <p className="text-sm font-bold text-gray-900">
                                                    {user?.name || "User"}
                                                </p>

                                                <p className="text-xs text-gray-500 truncate">
                                                    {user?.email || "production@greenfields.id"}
                                                </p>
                                            </div>

                                            <Link href="/dashboard" onClick={() => setIsDropdownOpen(false)}>
                                                <span className="w-[calc(100%-12px)] mx-1.5 flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors group cursor-pointer">
                                                    <LaptopMinimal className="h-4 w-4 text-gray-500 transition-transform group-hover:scale-105" />
                                                    Dashboard
                                                </span>
                                            </Link>

                                            <button
                                                onClick={() => {
                                                    setIsDropdownOpen(false);
                                                    handleLogout();
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
                    <Link href="/dokumentasi" onClick={() => setIsMobileMenuOpen(false)}>
                        <span className="hover:text-gray-600 transition-colors block">Dokumentasi</span>
                    </Link>
                    <Link href="/download" onClick={() => setIsMobileMenuOpen(false)}>
                        <span className="hover:text-gray-600 transition-colors block">Download App</span>
                    </Link>
                </nav>

                {/* Bottom: Auth Actions (Mobile Only) */}
                <div className="mt-8 flex justify-between items-end pb-4 pt-6 border-t border-gray-100">
                    <div className="flex flex-col gap-4 w-full">
                        {!isAuthenticated ? (
                            <Link
                                href="/login"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="text-gray-500 text-xl hover:text-[#111111] underline underline-offset-4 decoration-gray-300 hover:decoration-[#111111] transition-all"
                            >
                                Masuk
                            </Link>
                        ) : (
                            <div className="flex flex-col gap-3 w-full">
                                <Link
                                    href="/dashboard"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="text-emerald-600 text-xl font-semibold hover:text-emerald-700 transition-all"
                                >
                                    Dashboard Panel
                                </Link>
                                <button
                                    onClick={() => {
                                        handleLogout();
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="text-left text-red-500 text-lg font-semibold hover:text-red-700 transition-all cursor-pointer"
                                >
                                    Keluar
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
