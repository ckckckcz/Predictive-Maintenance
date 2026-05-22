import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Footer() {
    return (
        <footer className="relative w-full bg-white flex flex-col items-center font-sans overflow-hidden">
            {/* Wrapper */}
            <div className="relative w-[90%] max-w-7xl flex flex-col">

                {/* Vertical Grid Lines */}
                <div className="absolute top-[-100vh] bottom-[-100vh] left-0 w-[1px] bg-green-700 opacity-20 pointer-events-none" />
                <div className="absolute top-[-100vh] bottom-[-100vh] right-0 w-[1px] bg-green-700 opacity-20 pointer-events-none" />

                {/* Main Footer */}
                <div className="relative w-full lg:py-16 py-10 px-4 md:px-8">

                    {/* Horizontal Grid Lines */}
                    <div className="absolute top-0 left-[-100vw] right-[-100vw] h-[1px] bg-green-700 opacity-20 pointer-events-none" />
                    <div className="absolute bottom-0 left-[-100vw] right-[-100vw] h-[1px] bg-green-700 opacity-20 pointer-events-none" />

                    {/* Corner Marks */}
                    <div className="absolute top-[-1px] left-[-1px] w-3 h-3 border-t-[1.5px] border-l-[1.5px] border-green-700" />
                    <div className="absolute top-[-1px] right-[-1px] w-3 h-3 border-t-[1.5px] border-r-[1.5px] border-green-700" />
                    <div className="absolute bottom-[-1px] left-[-1px] w-3 h-3 border-b-[1.5px] border-l-[1.5px] border-green-700" />
                    <div className="absolute bottom-[-1px] right-[-1px] w-3 h-3 border-b-[1.5px] border-r-[1.5px] border-green-700" />

                    {/* Content */}
                    <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">

                        {/* Brand */}
                        <div className="flex flex-col gap-5 lg:pr-8">
                            <div className="flex items-center gap-3">
                                <div className="flex flex-col">
                                    <h2 className="text-[#111111] font-semibold text-[15px]">
                                        PT. Greenfields Indonesia
                                    </h2>

                                    <span className="text-[12px] text-gray-500">
                                        Industrial Monitoring Platform
                                    </span>
                                </div>
                            </div>

                            <p className="text-[14px] text-gray-500 leading-relaxed">
                                Platform monitoring mesin berbasis sensor untuk membantu
                                deteksi dini, analisis kondisi, dan pengurangan downtime operasional.
                            </p>
                        </div>

                        {/* System */}
                        <div className="flex flex-col gap-5">
                            <h3 className="text-[#111111] text-[14px] font-medium">
                                Link
                            </h3>

                            <div className="flex flex-col gap-3.5 text-[14px] text-gray-500">
                                <Link href="#" className="hover:text-green-700 transition-colors w-fit">
                                    Dokumentasi
                                </Link>

                                <Link href="#" className="hover:text-green-700 transition-colors w-fit">
                                    Download App
                                </Link>
                            </div>
                        </div>

                        {/* Information */}
                        <div className="flex flex-col gap-5">
                            <h3 className="text-[#111111] text-[14px] font-medium">
                                Informasi
                            </h3>

                            <div className="flex flex-col gap-3.5 text-[14px] text-gray-500">
                                <Link href="#" className="hover:text-green-700 transition-colors w-fit">
                                    Tentang Sistem
                                </Link>

                                <Link href="#" className="hover:text-green-700 transition-colors w-fit">
                                    Dokumentasi
                                </Link>

                                <Link href="#" className="hover:text-green-700 transition-colors w-fit">
                                    Teknologi
                                </Link>

                                <Link href="#" className="hover:text-green-700 transition-colors w-fit">
                                    Kontak
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Footer */}
                <div className="relative w-full pt-8 pb-10 px-4 md:px-8">

                    {/* Divider */}
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gray-200 pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4 text-[13px] text-gray-500">

                        <span className="text-center md:text-left">
                            © 2026 PT. Greenfields Indonesia. All rights reserved.
                        </span>

                        <div className="flex flex-wrap justify-center items-center gap-6">

                            <Link href="#" className="hover:text-green-700 transition-colors">
                                GitHub
                            </Link>

                            <Link href="#" className="hover:text-green-700 transition-colors">
                                Server Status
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}