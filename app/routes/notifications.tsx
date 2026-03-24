import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { supabase } from "~/lib/supabase";
import { useAuthContext } from "~/context/AuthContext";
import type { Notification } from "~/data/posts";

export function meta() {
  return [{ title: "Notifications — Threadly" }];
}

export default function Notifications() {
  const { user, loading } = useAuthContext();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [fetching, setFetching] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  // Initial fetch
  useEffect(() => {
    if (!user) return;

    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setNotifications((data ?? []) as Notification[]);
        setFetching(false);
      });
  }, [user]);

  // Realtime: keep the list in sync so the navbar badge updates instantly
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("notifications-page")
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => setNotifications((prev) => [payload.new as Notification, ...prev])
      )
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => setNotifications((prev) =>
          prev.map((n) => n.id === (payload.new as Notification).id ? payload.new as Notification : n)
        )
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Toggle a single notification's read state
  async function toggleRead(e: React.MouseEvent, n: Notification) {
    e.preventDefault();
    e.stopPropagation();
    const newState = !n.is_read;
    // Optimistic update
    setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, is_read: newState } : x));
    await supabase.from("notifications").update({ is_read: newState }).eq("id", n.id);
  }

  // Mark all as read
  async function markAllRead() {
    if (!user) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
  }

  function timeAgo(dateStr: string) {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (loading || fetching) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-violet-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </Link>
            <h1 className="text-xl font-bold text-slate-800">Notifications</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-xs font-bold rounded-full">
                {unreadCount} unread
              </span>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-violet-600 hover:text-violet-800 font-medium transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="text-slate-500 text-sm">No notifications yet.</p>
            <p className="text-slate-400 text-xs mt-1">When someone comments on your post, it'll show up here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-4 bg-white rounded-xl border px-5 py-4 transition-colors ${
                  !n.is_read ? "border-violet-300" : "border-slate-200"
                }`}
              >
                {/* Unread dot */}
                <div className="mt-1.5 flex-shrink-0">
                  <span className={`w-2.5 h-2.5 rounded-full block ${!n.is_read ? "bg-violet-500" : "bg-slate-200"}`} />
                </div>

                {/* Message — awaits mark-as-read then navigates */}
                <button
                  className="flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
                  onClick={async () => {
                    if (!n.is_read) {
                      setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, is_read: true } : x));
                      await supabase.from("notifications").update({ is_read: true }).eq("id", n.id);
                    }
                    navigate(`/post/${n.post_id}`);
                  }}
                >
                  <p className={`text-sm ${!n.is_read ? "font-medium text-slate-800" : "text-slate-600"}`}>
                    {n.message}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{timeAgo(n.created_at)}</p>
                </button>

                {/* Toggle read/unread button */}
                <button
                  onClick={(e) => toggleRead(e, n)}
                  title={n.is_read ? "Mark as unread" : "Mark as read"}
                  className="shrink-0 mt-0.5 p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                >
                  {n.is_read ? (
                    // Eye-off icon = mark as unread
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    // Check icon = mark as read
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
