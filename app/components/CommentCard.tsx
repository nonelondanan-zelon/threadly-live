import { useState } from "react";
import { supabase } from "~/lib/supabase";
import type { Comment } from "~/data/posts";

interface CommentCardProps {
  comment: Comment;
}

export default function CommentCard({ comment }: CommentCardProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.likes);

  const date = new Date(comment.created_at).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  async function handleLike() {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount((prev) => (newLiked ? prev + 1 : prev - 1));

    const { data } = await supabase.from("comments").select("likes").eq("id", comment.id).single();
    if (data) {
      const newCount = newLiked ? data.likes + 1 : Math.max(0, data.likes - 1);
      await supabase.from("comments").update({ likes: newCount }).eq("id", comment.id);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
          <span className="text-slate-600 font-bold text-xs">{comment.avatar}</span>
        </div>
        <div>
          <p className="font-medium text-slate-800 text-sm">{comment.author}</p>
          <p className="text-slate-400 text-xs">{date}</p>
        </div>
      </div>

      <p className="text-slate-600 text-sm leading-relaxed">{comment.body}</p>

      <div className="mt-3">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${
            liked
              ? "bg-violet-100 text-violet-700"
              : "text-slate-400 hover:bg-violet-50 hover:text-violet-600"
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
          </svg>
          {likeCount}
        </button>
      </div>
    </div>
  );
}
