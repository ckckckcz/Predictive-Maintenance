"use client"

import { useEffect } from "react"
import { api } from "@/lib/api"

export function PushSubscriptionManager() {
    useEffect(() => {
        if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
            return
        }

        const registerAndSubscribe = async () => {
            try {
                // 1. Register Service Worker
                const registration = await navigator.serviceWorker.register("/sw.js")

                // 2. Check if user is authenticated (only register push when logged in)
                const token = localStorage.getItem("token")
                if (!token) {
                    return
                }

                // 3. Request Notification Permission
                if (Notification.permission === "default") {
                    await Notification.requestPermission()
                }

                if (Notification.permission !== "granted") {
                    return
                }

                // 4. Fetch VAPID key
                const response = await api.get<{ vapid_public_key: string }>("/api/v1/notifications/vapid-key")
                const data = response as any
                const publicKey = data.vapid_public_key || data.data?.vapid_public_key

                if (!publicKey) {
                    console.error("VAPID public key not found in server response")
                    return
                }

                // 5. Subscribe to Web Push
                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(publicKey),
                })

                // 6. Post subscription to backend
                const jsonSub = subscription.toJSON()
                if (jsonSub.endpoint && jsonSub.keys?.p256dh && jsonSub.keys?.auth) {
                    await api.post("/api/v1/notifications/subscribe/web", {
                        endpoint: jsonSub.endpoint,
                        p256dh: jsonSub.keys.p256dh,
                        auth_key: jsonSub.keys.auth,
                    })
                }
            } catch (err) {
                console.error("Web Push Subscription failed:", err)
            }
        }

        // Delay registration slightly to allow other page elements to settle
        const timer = setTimeout(registerAndSubscribe, 2000)
        return () => clearTimeout(timer)
    }, [])

    return null
}

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
        .replace(/\-/g, "+")
        .replace(/_/g, "/")

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}
