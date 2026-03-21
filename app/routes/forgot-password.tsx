import { useState } from "react";
import { Link } from "react-router";
import { supabase } from "~/lib/supabase";

export function meta() {
  return [{ title: "Forgot Password — Threadly" }];
}

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // After the user clicks the link in their email,
      // Supabase sends them to this URL in your app
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    // Hide the form and show the confirmation message
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <span className="text-xl font-bold text-slate-800">Threadly</span>
        </div>

        {sent ? (
          // ✅ Success state — shown after email is sent
          <div className="text-center">
            <div className="text-4xl mb-4">📬</div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Check your email</h1>
            <p className="text-slate-500 text-sm mb-6">
              We sent a password reset link to{" "}
              <span className="font-medium text-slate-700">{email}</span>.
              Click the link in that email to set a new password.
            </p>
            <Link to="/login" className="text-violet-600 font-medium hover:underline text-sm">
              Back to log in
            </Link>
          </div>
        ) : (
          // 📧 Default state — the form
          <>
            <h1 className="text-2xl font-bold text-slate-800 mb-1 text-center">Forgot your password?</h1>
            <p className="text-slate-500 text-sm text-center mb-6">
              Enter your email and we'll send you a reset link.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
              >
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-6">
              Remember it?{" "}
              <Link to="/login" className="text-violet-600 font-medium hover:underline">
                Back to log in
              </Link>
            </p>
          </>
        )}

      </div>
    </div>
  );
}
