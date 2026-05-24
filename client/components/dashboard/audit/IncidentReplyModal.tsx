import { useState, useRef, useEffect } from "react"
import { Clock, MessageCircle, RefreshCw, Send } from "lucide-react"
import { ResponsiveModal } from "@/components/dashboard/responsive-modal"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { IncidentReply, IncidentWithDetails } from "@/types/audit"

interface IncidentReplyModalProps {
    incident: IncidentWithDetails | null
    onClose: () => void
    replies: IncidentReply[]
    loading: boolean
    currentUserId: string | null
    onSendReply: (message: string, status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | null) => Promise<void>
}

export function IncidentReplyModal({
    incident,
    onClose,
    replies,
    loading,
    currentUserId,
    onSendReply,
}: IncidentReplyModalProps) {
    const [replyMessage, setReplyMessage] = useState("")
    const [replyStatus, setReplyStatus] = useState<"OPEN" | "IN_PROGRESS" | "RESOLVED" | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const chatEndRef = useRef<HTMLDivElement>(null)

    // Auto-scroll chat window
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [replies])

    if (!incident) return null

    const handleSend = async () => {
        if (!replyMessage.trim() && !replyStatus) return
        setSubmitting(true)
        try {
            await onSendReply(replyMessage, replyStatus)
            setReplyMessage("")
            setReplyStatus(null)
        } finally {
            setSubmitting(false)
        }
    }

    const getSeverityBadgeClass = (severity: string) => {
        switch (severity) {
            case "CRITICAL":
                return "bg-red-50 text-red-700 border-red-200"
            case "HIGH":
                return "bg-orange-50 text-orange-700 border-orange-200"
            case "MEDIUM":
                return "bg-amber-50 text-amber-700 border-amber-200"
            default:
                return "bg-blue-50 text-blue-700 border-blue-200"
        }
    }

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case "RESOLVED":
                return "bg-emerald-50 text-emerald-700 border-emerald-200"
            case "IN_PROGRESS":
                return "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
            default:
                return "bg-red-50 text-red-700 border-red-200"
        }
    }

    return (
        <ResponsiveModal
            open={incident !== null}
            onOpenChange={(open) => {
                if (!open) onClose()
            }}
            showCloseButton={true}
            title="Respon & Arahan Laporan"
            description={`No. Tiket: #${incident.id.substring(0, 8)} | Mesin: ${incident.machine_code}`}
        >
            <div className="flex flex-col h-[60vh] gap-4">
                {/* Summary of Incident */}
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-extrabold border", getSeverityBadgeClass(incident.severity))}>
                            {incident.severity}
                        </span>
                        <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-extrabold border", getStatusBadgeClass(incident.status))}>
                            STATUS: {incident.status}
                        </span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm leading-tight">{incident.title}</h3>
                    {incident.description && (
                        <p className="text-gray-600 text-xs leading-normal">
                            {incident.description}
                        </p>
                    )}
                    <div className="text-[10px] text-gray-400 flex items-center gap-1.5 mt-1 font-medium">
                        <Clock className="h-3 w-3" />
                        Dilaporkan pada {new Date(incident.created_at).toLocaleString("id-ID")}
                    </div>
                </div>

                {/* Message History Thread */}
                <div className="flex-1 border border-gray-100 rounded-xl bg-gray-50/30 overflow-y-auto p-4 space-y-3 flex flex-col">
                    {loading ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-10">
                            <RefreshCw className="h-5 w-5 animate-spin mb-2 text-emerald-600" />
                            <span className="text-xs">Memuat percakapan...</span>
                        </div>
                    ) : replies.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-10 text-center space-y-2">
                            <MessageCircle className="h-10 w-10 text-gray-300" />
                            <div>
                                <div className="font-semibold text-gray-700 text-xs">Belum ada tanggapan</div>
                                <div className="text-[10px] max-w-[200px] text-gray-400 mt-0.5">Ketik tanggapan atau instruksi perbaikan untuk operator di bawah ini.</div>
                            </div>
                        </div>
                    ) : (
                        replies.map((reply) => {
                            const isMe = reply.user_id === currentUserId
                            return (
                                <div
                                    key={reply.id}
                                    className={cn(
                                        "max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-sm flex flex-col",
                                        isMe
                                            ? "bg-emerald-600 text-white self-end rounded-tr-none"
                                            : "bg-white border border-gray-100 text-gray-800 self-start rounded-tl-none"
                                    )}
                                >
                                    <div className="flex items-center gap-1.5 font-bold mb-1">
                                        <span className={isMe ? "text-emerald-100" : "text-gray-800"}>
                                            {reply.user_name}
                                        </span>
                                        <span
                                            className={cn(
                                                "text-[8px] px-1 rounded font-extrabold uppercase",
                                                isMe
                                                    ? "bg-emerald-700 text-emerald-100"
                                                    : reply.user_role === "SUPERVISOR"
                                                    ? "bg-emerald-100 text-emerald-800"
                                                    : "bg-blue-100 text-blue-800"
                                            )}
                                        >
                                            {reply.user_role}
                                        </span>
                                    </div>
                                    <p className="leading-relaxed whitespace-pre-wrap">{reply.message}</p>
                                    <span
                                        className={cn(
                                            "text-[8px] mt-1.5 text-right font-medium self-end",
                                            isMe ? "text-emerald-200" : "text-gray-400"
                                        )}
                                    >
                                        {new Date(reply.created_at).toLocaleTimeString("id-ID", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </span>
                                </div>
                            )
                        })
                    )}
                    <div ref={chatEndRef} />
                </div>

                {/* Reply Form */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <Label className="text-xs font-bold text-gray-700">Tindakan & Ubah Status</Label>
                        <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                            <button
                                type="button"
                                onClick={() => setReplyStatus(replyStatus === "IN_PROGRESS" ? null : "IN_PROGRESS")}
                                className={cn(
                                    "px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-all",
                                    replyStatus === "IN_PROGRESS" || incident.status === "IN_PROGRESS" && replyStatus === null
                                        ? "bg-amber-500 text-white shadow-sm"
                                        : "text-gray-500 hover:text-gray-800 hover:bg-gray-200/50"
                                )}
                            >
                                PROSES
                            </button>
                            <button
                                type="button"
                                onClick={() => setReplyStatus(replyStatus === "RESOLVED" ? null : "RESOLVED")}
                                className={cn(
                                    "px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-all",
                                    replyStatus === "RESOLVED" || incident.status === "RESOLVED" && replyStatus === null
                                        ? "bg-emerald-600 text-white shadow-sm"
                                        : "text-gray-500 hover:text-gray-800 hover:bg-gray-200/50"
                                )}
                            >
                                SELESAI
                            </button>
                        </div>
                    </div>

                    <div className="flex items-end gap-2">
                        <textarea
                            value={replyMessage}
                            onChange={(e) => setReplyMessage(e.target.value)}
                            placeholder={
                                replyStatus
                                    ? `Ketik arahan pelengkap untuk mengubah status ke ${replyStatus}...`
                                    : "Ketik arahan atau balasan perbaikan..."
                            }
                            className="flex-1 min-h-[44px] max-h-[120px] rounded-xl border border-gray-200 bg-white p-3 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSend()
                                }
                            }}
                        />
                        <Button
                            onClick={handleSend}
                            disabled={submitting || (!replyMessage.trim() && !replyStatus)}
                            className="h-11 w-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white p-0 flex items-center justify-center cursor-pointer shadow-md"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </ResponsiveModal>
    )
}
