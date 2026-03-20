import { useState } from "react";
import { Link } from "react-router";
import type { Post } from "~/data/posts";
import { supabase } from "~/lib/supabase";
import Badge from "./Badge";

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.upvotes);

  const excerpt = post.body.slice(0, 150) + (post.body.length > 150 ? "..." : "");
  const date = new Date(post.created_at).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  async function handleLike(e: React.MouseEvent) {
    e.preventDefault();
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount((prev) => (newLiked ? prev + 1 : prev - 1));

    // Call Supabase directly from the browser — no server needed
    const { data } = await supabase.from("posts").select("upvotes").eq("id", post.id).single();
    if (data) {
      const newCount = newLiked ? data.upvotes + 1 : Math.max(0, data.upvotes - 1);
      await supabase.from("posts").update({ upvotes: newCount }).eq("id", post.id);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-violet-200 transition-all duration-200">
      <Link to={`/post/${post.id}`} className="block p-5 pb-3">
        <div className="mb-3 flex items-center gap-2">
          <Badge category={post.tag} />
          <span className="text-xs text-slate-400">{post.community}</span>
        </div>
        <h2 className="text-slate-800 font-semibold text-base leading-snug mb-2 hover:text-violet-700 transition-colors line-clamp-2">
          {post.title}
        </h2>
        <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 mb-3">
          {excerpt}
        </p>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
            <span className="text-violet-700 text-xs font-bold">{post.avatar}</span>
          </div>
          <p className="text-xs font-medium text-slate-700">{post.author}</p>
          <p className="text-xs text-slate-400">· {date}</p>
        </div>
      </Link>

      <div className="px-5 pb-4 pt-2 border-t border-slate-100">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
            liked
              ? "bg-violet-100 text-violet-700"
              : "text-slate-500 hover:bg-violet-50 hover:text-violet-600"
          }`}
        >
          <svg className="w-3.5 h-3.5" fill={liked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
          {liked ? "Liked" : "Like"} · {likeCount}
        </button>
      </div>
    </div>
  );
}
