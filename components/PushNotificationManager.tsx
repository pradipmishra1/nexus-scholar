"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";

export default function PushNotificationManager() {
  const [permission, setPermission] = useState<NotificationPermission | "default">("default");
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeUser = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      alert("Push notifications not supported");
      return;
    }

    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm === "granted") {
        const registration = await navigator.serviceWorker.ready;
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
        const convertedKey = urlBase64ToUint8Array(vapidPublicKey);
        const sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey,
        });
        setSubscription(sub);

        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sub),
        });
      }
    } catch (error) {
      console.error("Subscription failed:", error);
    }
    setLoading(false);
  };

  const unsubscribeUser = async () => {
    if (subscription) {
      await subscription.unsubscribe();
      setSubscription(null);
      setPermission("default");
    }
  };

  const sendTestNotification = async () => {
    if (!subscription) return;
    await fetch("/api/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscription,
        title: "Nexus Scholar",
        body: "This is a test notification!",
        url: "/home",
      }),
    });
    alert("Test notification sent!");
  };

  if (typeof window === "undefined" || !("Notification" in window)) {
    return <p className="text-sm text-slate-500">Notifications not supported.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Push Notifications</span>
        {permission === "granted" ? (
          <button onClick={unsubscribeUser} className="text-red-500 text-sm flex items-center gap-1">
            <BellOff className="w-4 h-4" /> Disable
          </button>
        ) : (
          <button onClick={subscribeUser} disabled={loading} className="text-indigo-600 text-sm flex items-center gap-1">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
            Enable
          </button>
        )}
      </div>
      {permission === "granted" && (
        <button onClick={sendTestNotification} className="w-full py-2 bg-slate-100 text-slate-700 rounded-lg text-sm">
          Send Test Notification
        </button>
      )}
    </div>
  );
}