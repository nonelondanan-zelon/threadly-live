import { Link, useLoaderData, redirect } from "react-router";
import { supabase } from "~/lib/supabase";

export async function clientLoader() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return redirect("/login");

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, bio, username, location, website, avatar_url")
    .eq("id", session.user.id)
    .single();

  // Fetch post count
  const { count } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", session.user.id);

  return { user: session.user, profile, postCount: count ?? 0 };
}

clientLoader.hydrate = true;

export function meta() {
  return [{ title: "Profile — Threadly" }];
}

export default function ProfileView() {
  const { user, profile, postCount } = useLoaderData<typeof clientLoader>();

  const displayName = profile?.display_name || user.email;
  const initials = displayName.slice(0, 2).toUpperCase();

  const joinedDate = new Date(user.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">

          {/* Avatar + name + username */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-5">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile photo"
                  className="w-16 h-16 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-violet-600 flex items-center justify-center shrink-0">
                  <span className="text-white text-xl font-bold">{initials}</span>
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-slate-800">
                  {profile?.display_name || "No display name yet"}
                </h1>
                {profile?.username && (
                  <p className="text-violet-600 text-sm font-medium">@{profile.username}</p>
                )}
                <p className="text-slate-400 text-sm">{user.email}</p>
              </div>
            </div>
            <Link
              to="/profile/edit"
              className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Edit Profile
            </Link>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-6 py-4 border-y border-slate-100 mb-6">
            <div className="text-center">
              <p className="text-xl font-bold text-slate-800">{postCount}</p>
              <p className="text-xs text-slate-500">Posts</p>
            </div>
            <div className="h-8 w-px bg-slate-100" />
            <div>
              <p className="text-sm font-medium text-slate-700">Joined</p>
              <p className="text-xs text-slate-500">{joinedDate}</p>
            </div>
          </div>

          {/* Bio */}
          <div className="mb-5">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Bio</h2>
            <p className="text-slate-700 text-sm leading-relaxed">
              {profile?.bio || "No bio yet."}
            </p>
          </div>

          {/* Location + Website */}
          <div className="flex flex-col gap-2">
            {profile?.location && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {profile.location}
              </div>
            )}
            {profile?.website && (
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-600 hover:underline"
                >
                  {profile.website.replace(/^https?:\/\//, "")}
                </a>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
