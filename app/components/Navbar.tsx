import { NavLink, Link, useNavigate } from "react-router";
import { useAuthContext } from "~/context/AuthContext";

export default function Navbar() {
  const navigate = useNavigate();
  const { user, loading, logout } = useAuthContext();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "";

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
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
