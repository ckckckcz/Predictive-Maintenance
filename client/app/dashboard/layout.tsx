import { Sidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen w-full bg-gray-50">
            <Sidebar className="hidden w-64 lg:block fixed inset-y-0 left-0 z-10 bg-white shadow-sm" />
            <div className="flex flex-col w-full lg:pl-64 transition-all duration-300">
                <DashboardHeader />
                <main className="flex-1 p-4 md:p-6 pt-2">
                    {children}
                </main>
            </div>
        </div>
    )
}
