// Footer component — appears at the bottom of every page.
export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-violet-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xs">T</span>
            </div>
            <span className="text-slate-700 font-semibold">Threadly</span>
          </div>

          {/* Tagline */}
          <p className="text-slate-400 text-sm text-center">
            A community for developers and designers to share ideas.
          </p>

          {/* Copyright */}
          <p className="text-slate-400 text-sm">© 2026 Threadly</p>
        </div>
      </div>
    </footer>
  );
}
