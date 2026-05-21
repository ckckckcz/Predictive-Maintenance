import { OverviewCards } from "@/components/dashboard/overview-cards"
import { ProductionTable } from "@/components/dashboard/production-table"

export default function DashboardPage() {
    return (
        <div className="space-y-4 mx-auto animate-in fade-in-50 duration-500">
            {/* Header Section */}
            <div className="flex items-center justify-between gap-2">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-gray-900">Dashboard Overview</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">Monitoring produksi dan kualitas real-time.</p>
                </div>
            </div>

            {/* Overview Stats */}
            <OverviewCards />

            {/* Table Section */}
            <div className="mt-4">
                <ProductionTable />
            </div>
        </div>
    )
}
