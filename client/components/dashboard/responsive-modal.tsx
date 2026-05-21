import * as React from "react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { 
    Sheet, 
    SheetContent, 
    SheetHeader, 
    SheetTitle, 
    SheetFooter 
} from "@/components/ui/sheet"
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerFooter,
} from "@/components/ui/drawer"

interface ResponsiveModalProps {
    children: React.ReactNode
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description?: string
    footer?: React.ReactNode
    showCloseButton?: boolean
    forceDrawerOnMobile?: boolean
}

export function ResponsiveModal({
    children,
    open,
    onOpenChange,
    title,
    description,
    footer,
    showCloseButton = true,
    forceDrawerOnMobile = false,
}: ResponsiveModalProps) {
    const isDesktop = useMediaQuery("(min-width: 1024px)")

    if (!isDesktop && forceDrawerOnMobile) {
        return (
            <Drawer open={open} onOpenChange={onOpenChange}>
                <DrawerContent className="p-0 overflow-hidden">
                    <DrawerHeader className="p-6 border-b bg-gray-50/50">
                        <DrawerTitle className="text-xl text-left font-bold text-gray-800">{title}</DrawerTitle>
                        {description && <div className="text-sm text-gray-500 mt-1">{description}</div>}
                    </DrawerHeader>
                    <div className="p-6">
                        {children}
                    </div>
                    {footer && (
                        <DrawerFooter className="p-6 border-t bg-gray-50/50 flex flex-col gap-3">
                            {footer}
                        </DrawerFooter>
                    )}
                </DrawerContent>
            </Drawer>
        )
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent 
                showCloseButton={showCloseButton} 
                className="w-full sm:max-w-[550px] flex flex-col p-0 gap-0 border-l shadow-2xl"
            >
                <SheetHeader className="p-6 border-b bg-gray-50/50">
                    <SheetTitle className="text-xl font-bold text-gray-800">{title}</SheetTitle>
                    {description && <div className="text-sm text-gray-500 mt-1">{description}</div>}
                </SheetHeader>
                <div className="flex-1 overflow-y-auto p-6">
                    {children}
                </div>
                {footer && (
                    <SheetFooter className="p-6 border-t bg-gray-50/50 sm:flex-row gap-3">
                        {footer}
                    </SheetFooter>
                )}
            </SheetContent>
        </Sheet>
    )
}
