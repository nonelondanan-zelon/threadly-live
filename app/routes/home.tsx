import { useState, useEffect } from "react";
import { Link, useLoaderData } from "react-router";
import { supabase } from "~/lib/supabase";
import { CATEGORIES, type Post } from "~/data/posts";
import PostCard from "~/components/PostCard";

// loader runs on the server before this page renders.
// It fetches all posts from Supabase and returns them.
export async function clientLoader() {
  const { data } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  return { posts: (data ?? []) as Post[] };
}

clientLoader.hydrate = true;

export function meta() {
  return [
    { title: "Threadly — Community Forum" },
    { name: "description", content: "A community for developers and designers." },
  ];
}

export default function Home() {
  const { posts: initialPosts } = useLoaderData<typeof clientLoader>();
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("threadly_current_user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  // Realtime: keep the post list live without needing a refresh
  useEffect(() => {
    const channel = supabase
      .channel("home-posts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" },
        (payload) => setPosts((prev) => [payload.new as Post, ...prev])
      )
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "posts" },
        (payload) => setPosts((prev) => prev.map((p) => p.id === (payload.new as Post).id ? payload.new as Post : p))
      )
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "posts" },
        (payload) => setPosts((prev) => prev.filter((p) => p.id !== (payload.old as Post).id))
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Filter posts in the browser based on search and category
  const filteredPosts = posts.filter((post) => {
    const excerpt = post.body.slice(0, 150);
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      excerpt.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      activeCategory === "All" || post.tag === activeCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero banner */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-3">
            {user ? `Welcome back, ${user.name.split(" ")[0]}!` : "Welcome to Threadly"}
          </h1>
          <p className="text-slate-500 text-lg mb-4 max-w-xl mx-auto">
            A community where developers and designers share what they've learned.
          </p>


          {/* Search bar */}
          <div className="relative max-w-md mx-auto">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-slate-50"
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category filter tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-violet-600 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-slate-500 text-sm">
            {filteredPosts.length} {filteredPosts.length === 1 ? "post" : "posts"}
            {activeCategory !== "All" && ` in ${activeCategory}`}
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
          <Link
            to="/create"
            className="text-sm text-violet-600 font-medium hover:text-violet-700"
          >
            + New Post
          </Link>
        </div>

        {/* Post grid */}
        {filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">🔍</div>
            <h3 className="text-slate-700 font-semibold text-lg mb-1">No posts found</h3>
            <p className="text-slate-400 text-sm">
              Try a different search or category, or{" "}
              <Link to="/create" className="text-violet-600 hover:underline">
                create the first one
              </Link>
              .
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
