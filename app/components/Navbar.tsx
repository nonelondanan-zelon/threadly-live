import { NavLink, Link, useNavigate, useLocation } from "react-router";
import { useEffect, useState } from "react";
import { useAuthContext } from "~/context/AuthContext";
import { supabase } from "~/lib/supabase";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, logout } = useAuthContext();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "";

  const [unreadCount, setUnreadCount] = useState(0);
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  async function fetchUnread(userId: string) {
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    setUnreadCount(count ?? 0);
  }

  // Re-fetch on every page navigation so clicking a notification updates the badge
  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }
    fetchUnread(user.id);
  }, [user, location.pathname]);

  // Realtime: handle new incoming notifications
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("navbar-notifications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        (payload: any) => {
          const row = payload.new ?? payload.old;
          if (row?.user_id === user!.id) fetchUnread(user!.id);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="text-xl font-bold text-slate-800">Threadly</span>
          </NavLink>

          {/* Center nav links */}
          <div className="flex items-center gap-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-violet-100 text-violet-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/create"
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-violet-100 text-violet-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`
              }
            >
              + New Post
            </NavLink>
          </div>

          {/* Auth area */}
          {loading ? (
            <div className="w-24 h-8 bg-slate-100 rounded-lg animate-pulse" />
          ) : user ? (
            // Logged in — show avatar, email, and logout button
            <div className="flex items-center gap-3">
              {/* Dark mode toggle */}
              <button
                onClick={() => setDark((d) => !d)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-violet-600 hover:bg-violet-50 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                title={dark ? "Switch to light mode" : "Switch to dark mode"}
              >
                {dark ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              {/* Bell icon with unread badge */}
              <Link to="/notifications" className="relative p-1.5 rounded-lg text-slate-500 hover:text-violet-600 hover:bg-violet-50 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-violet-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>

              <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{initials}</span>
                </div>
                <span className="text-sm font-medium text-slate-700 hidden sm:block">
                  {user.email}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Log out
              </button>
            </div>
          ) : (
            // Logged out — show login and signup buttons
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors"
              >
                Sign up
              </Link>
            </div>
          )}

        </div>
      </div>
    </nav>
  );
}
