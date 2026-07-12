"use client";

import { useState, useCallback, useEffect } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import { usePolling } from "@/hooks/usePolling";

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: string;
  fromUserName: string;
}

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=10");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
      const countRes = await fetch("/api/notifications/unread-count");
      if (countRes.ok) {
        const countData = await countRes.json();
        setUnreadCount(countData.count || 0);
      }
    } catch {}
  }, []);

  usePolling(fetchNotifications, 15000);

  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  const markAllRead = async () => {
    setLoading(true);
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: "all" }),
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
    setLoading(false);
  };

  const markOneRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const timeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return "à l'instant";
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
    return `il y a ${Math.floor(diff / 86400)}j`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-40 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  disabled={loading}
                  className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700"
                >
                  {loading ? <Loader2 size={12} className="animate-spin" /> : <CheckCheck size={12} />}
                  Tout marquer lu
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-slate-400">
                  Aucune notification
                </div>
              ) : (
                notifications.map((n) => (
                  <Link
                    key={n._id}
                    href={n.link || "#"}
                    onClick={() => { if (!n.read) markOneRead(n._id); setOpen(false); }}
                    className={`flex gap-3 border-b border-slate-50 px-4 py-3 transition ${
                      n.read ? "bg-white hover:bg-slate-50" : "bg-violet-50/50 hover:bg-violet-50"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${n.read ? "text-slate-700" : "font-semibold text-slate-800"}`}>
                        {n.title}
                      </p>
                      {n.message && (
                        <p className="mt-0.5 truncate text-xs text-slate-500">{n.message}</p>
                      )}
                      <p className="mt-1 text-[10px] text-slate-400">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.read && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-violet-600" />
                    )}
                  </Link>
                ))
              )}
            </div>
            <Link
              href="/dashboard/activities"
              onClick={() => setOpen(false)}
              className="block rounded-b-xl border-t border-slate-100 px-4 py-2.5 text-center text-xs font-medium text-violet-600 hover:bg-violet-50"
            >
              Voir tout l&apos;historique
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
