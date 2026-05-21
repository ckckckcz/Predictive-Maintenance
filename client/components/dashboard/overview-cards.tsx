"use client"

import {
    ArrowDownRight,
    ArrowUpRight,
    Activity,
    AlertTriangle,
    CheckCircle,
    Clock,
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const stats = [
    {
        title: "Total Mesin",
        value: "128",
        change: "+12%",
        positive: true,
        icon: Activity,
        color: "text-blue-600",
        bgColor: "bg-blue-100",
        borderColor: "border-blue-100",
    },
    {
        title: "Maintenance Aktif",
        value: "24",
        change: "+4%",
        positive: true,
        icon: Clock,
        color: "text-yellow-600",
        bgColor: "bg-yellow-100",
        borderColor: "border-yellow-100",
    },
    {
        title: "Issue Terdeteksi",
        value: "7",
        change: "-2%",
        positive: false,
        icon: AlertTriangle,
        color: "text-red-600",
        bgColor: "bg-red-100",
        borderColor: "border-red-100",
    },
    {
        title: "Mesin Stabil",
        value: "97%",
        change: "+8%",
        positive: true,
        icon: CheckCircle,
        color: "text-green-600",
        bgColor: "bg-green-100",
        borderColor: "border-green-100",
    },
]

export function OverviewCards() {
    return (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
                <Card
                    key={index}
                    className={cn(
                        "overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border",
                        stat.borderColor
                    )}
                >
                    <CardContent className="px-6 py-3">
                        <div className="flex items-center justify-between space-y-0 pb-2">
                            <p className="text-md font-semibold text-muted-foreground">
                                {stat.title}
                            </p>

                            <div className={cn("p-2 rounded-full", stat.bgColor)}>
                                <stat.icon
                                    className={cn("h-5 w-5", stat.color)}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1 mt-2">
                            <h3 className="text-3xl font-bold tracking-tight mb-2">
                                {stat.value}
                            </h3>

                            <div className="flex items-center text-xs text-muted-foreground">
                                <span
                                    className={cn(
                                        "flex items-center font-semibold px-1.5 py-0.5 rounded-full mr-2",
                                        stat.positive
                                            ? "bg-green-100 text-green-700"
                                            : "bg-red-100 text-red-700"
                                    )}
                                >
                                    {stat.positive ? (
                                        <ArrowUpRight className="h-3 w-3 mr-0.5" />
                                    ) : (
                                        <ArrowDownRight className="h-3 w-3 mr-0.5" />
                                    )}

                                    {stat.change}
                                </span>

                                <span>vs bulan lalu</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}