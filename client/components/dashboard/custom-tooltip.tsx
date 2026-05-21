"use client";

import { cn } from "@/lib/utils";
import { CustomTooltipProps } from "@/types/dashboard";

export function CustomTooltip({ active, payload, label, hideLabel = false }: CustomTooltipProps) {
    if (active && payload && payload.length) {
        return (
            <div className={cn(
                "rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
                "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
                "min-w-[120px]"
            )}>
                {!hideLabel && label && <p className="font-medium mb-1.5 text-muted-foreground">{label}</p>}
                <div className="flex flex-col gap-1">
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-2 h-2 rounded-full ring-1 ring-inset ring-foreground/20"
                                    style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-muted-foreground capitalize">
                                    {entry.name}:
                                </span>
                            </div>
                            <span className="font-mono font-medium text-foreground">
                                {entry.value.toLocaleString()}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
}
