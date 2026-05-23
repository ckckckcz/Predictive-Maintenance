"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAuthPage = pathname === "/login/" || pathname.includes("/login") || pathname.startsWith("/dashboard");

    const hideLayout = isAuthPage;

    return (
        <>
            {!hideLayout && <Navbar />}
            {children}
            {!hideLayout && <Footer />}
        </>
    );
}
