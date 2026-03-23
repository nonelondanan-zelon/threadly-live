import { useState, useEffect } from "react";
import { Link, useLoaderData, useFetcher } from "react-router";
import type { ClientLoaderFunctionArgs, ClientActionFunctionArgs } from "react-router";
import { supabase } from "~/lib/supabase";
import { useAuthContext } from "~/context/AuthContext";
import type { Post, Comment } from "~/data/posts";
import Badge from "~/components/Badge";
import Button from "~/components/Button";
import CommentCard from "~/components/CommentCard";

// Client-side like handler — calls Supabase directly from the browser
async function saveLike(postId: number, newLiked: boolean) {
  const { data } = await supabase.from("posts").select("upvotes").eq("id", postId).single();
  if (data) {
    const newCount = newLiked ? data.upvotes + 1 : Math.max(0, data.upvotes - 1);
    await supabase.from("posts").update({ upvotes: newCount }).eq("id", postId);
  }
}

// loader fetches the post and its comments from Supabase before the page renders.
export async function clientLoader({ params }: ClientLoaderFunctionArgs) {
  const { data: post } = await supabase
    .from("posts")
    .select("*")
    .eq("id", params.id)
    .single();

  const { data: comments } = await supabase
    .from("comments")
    .select("*")
    .eq("post_id", params.id)
    .order("created_at", { ascending: true });

  return { post: post as Post, comments: (comments ?? []) as Comment[] };
}

clientLoader.hydrate = true;

// action handles comment submissions and post edits, distinguished by "intent".
export async function clientAction({ request, params }: ClientActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "edit-post") {
    const title = formData.get("title") as string;
    const body = formData.get("body") as string;

    if (!title?.trim() || !body?.trim()) {
      return { error: "Title and content cannot be empty." };
    }

    const { error } = await supabase
      .from("posts")
      .update({ title: title.trim(), body: body.trim() })
      .eq("id", params.id);

    if (error) return { error: "Failed to save post: " + error.message };

    return { editSuccess: true };
  }

  // Default: add comment
  const body = formData.get("body") as string;
  const author = (formData.get("author") as string) || "User";

  if (!body?.trim()) {
    return { error: "Comment cannot be empty." };
  }

  const { data: { session } } = await supabase.auth.getSession();

  const { error } = await supabase.from("comments").insert({
    post_id: Number(params.id),
    body,
    author,
    avatar: author.charAt(0).toUpperCase(),
    likes: 0,
    user_id: session?.user?.id ?? null,
  });

  if (error) return { error: "Failed to post comment: " + error.message };

  return { success: true };
}

export function meta() {
  return [{ title: "Post — Threadly" }];
}

export default function PostDetail() {
  const { post, comments } = useLoaderData<typeof clientLoader>();
  const fetcher = useFetcher<typeof clientAction>();
  const editFetcher = useFetcher<typeof clientAction>();
  const { user } = useAuthContext();

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.upvotes);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title);
  const [editBody, setEditBody] = useState(post.body);
  const [commentBody, setCommentBody] = useState("");
  const [displayName, setDisplayName] = useState("");

  // Fetch the logged-in user's display name from profiles
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        setDisplayName(data?.display_name || user.email?.split("@")[0] || "User");
      });
  }, [user]);

  // Clear comment box after successful submit
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.success) {
      setCommentBody("");
    }
  }, [fetcher.state, fetcher.data]);

  // Close edit mode once the save succeeds
  useEffect(() => {
    if (editFetcher.state === "idle" && editFetcher.data?.editSuccess) {
      setEditing(false);
    }
  }, [editFetcher.state, editFetcher.data]);

  function handleLike() {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount((prev) => (newLiked ? prev + 1 : prev - 1));
    saveLike(post.id, newLiked);
  }

  const date = new Date(post.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const isSubmitting = fetcher.state === "submitting";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Back button */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-violet-600 mb-8 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to all posts
        </Link>

        {/* Post card */}
        <article className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 sm:p-8">
            {/* Tag + community + date */}
            <div className="flex items-center gap-3 mb-4">
              <Badge category={post.tag} />
              <span className="text-slate-400 text-sm">{post.community}</span>
              <span className="text-slate-400 text-sm">{date}</span>
            </div>

            {/* Title */}
            {editing ? (
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full text-2xl sm:text-3xl font-bold text-slate-800 leading-tight mb-6 px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            ) : (
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 leading-tight mb-6">
                {editTitle}
              </h1>
            )}

            {/* Author */}
            <div className="flex items-center gap-3 pb-6 border-b border-slate-100 mb-6">
              <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                <span className="text-violet-700 font-bold text-sm">{post.avatar}</span>
              </div>
              <div>
                <p className="font-medium text-slate-800 text-sm">{post.author}</p>
                <p className="text-slate-400 text-xs">Posted on {date}</p>
              </div>
            </div>

            {/* Full post content */}
            {editing ? (
              <textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                rows={12}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm text-slate-700 leading-relaxed focus:outline-none focus:ring-2 focus:ring-violet-500 resize-y"
              />
            ) : (
              <div className="text-slate-700 leading-relaxed whitespace-pre-line text-base">
                {editBody}
              </div>
            )}

            {/* Like + Edit buttons */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-3 flex-wrap">
              {!editing && (
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    liked
                      ? "bg-violet-100 text-violet-700"
                      : "bg-slate-100 text-slate-600 hover:bg-violet-50 hover:text-violet-600"
                  }`}
                >
                  <svg className="w-4 h-4" fill={liked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                  </svg>
                  {liked ? "Liked" : "Like"} · {likeCount}
                </button>
              )}

              <span className={`text-slate-400 text-sm ${editing ? "hidden" : ""}`}>
                {comments.length} {comments.length === 1 ? "comment" : "comments"}
              </span>

              <div className="ml-auto flex items-center gap-2">
                {editing ? (
                  <>
                    <button
                      onClick={() => {
                        setEditTitle(post.title);
                        setEditBody(post.body);
                        setEditing(false);
                      }}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <editFetcher.Form method="post">
                      <input type="hidden" name="intent" value="edit-post" />
                      <input type="hidden" name="title" value={editTitle} />
                      <input type="hidden" name="body" value={editBody} />
                      <button
                        type="submit"
                        disabled={editFetcher.state === "submitting"}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                      >
                        {editFetcher.state === "submitting" ? "Saving..." : "Save changes"}
                      </button>
                    </editFetcher.Form>
                    {editFetcher.data?.error && (
                      <p className="text-red-500 text-xs">{editFetcher.data.error}</p>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                )}
              </div>
            </div>
          </div>
        </article>

        {/* Comments section */}
        <section className="mt-8">
          <h2 className="text-lg font-bold text-slate-800 mb-4">
            Comments ({comments.length})
          </h2>

          {/* Add comment form */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
            {user ? (
              <fetcher.Form method="post" className="flex flex-col gap-3">
                <input type="hidden" name="author" value={displayName} />
                <p className="text-xs text-slate-500">
                  Commenting as <span className="font-medium text-slate-700">{displayName}</span>
                </p>
                <textarea
                  name="body"
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  placeholder="Write a comment..."
                  rows={3}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
                {fetcher.data?.error && (
                  <p className="text-red-500 text-xs">{fetcher.data.error}</p>
                )}
                <div className="flex justify-end">
                  <Button type="submit" variant="primary" disabled={isSubmitting}>
                    {isSubmitting ? "Posting..." : "Post comment"}
                  </Button>
                </div>
              </fetcher.Form>
            ) : (
              <p className="text-sm text-slate-500 text-center py-2">
                <Link to="/login" className="text-violet-600 hover:underline font-medium">Log in</Link> to leave a comment.
              </p>
            )}
          </div>

          {comments.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <p className="text-slate-400 text-sm">No comments yet. Be the first!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {comments.map((comment) => (
                <CommentCard key={comment.id} comment={comment} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
