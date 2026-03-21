import { Link, Form, useNavigation, useActionData, redirect } from "react-router";
import type { ClientActionFunctionArgs } from "react-router";
import { supabase } from "~/lib/supabase";
import { CATEGORIES } from "~/data/posts";
import Button from "~/components/Button";

// Bouncer: only logged-in users can create posts
// Also fetches their profile to use their name on the post
export async function clientLoader() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, username")
    .eq("id", session.user.id)
    .single();

  return { user: session.user, profile };
}

export function meta() {
  return [
    { title: "Create Post — Threadly" },
    { name: "description", content: "Share something with the Threadly community." },
  ];
}

// action runs on the server when the form is submitted.
// It reads the form fields, saves to Supabase, then redirects to home.
export async function clientAction({ request }: ClientActionFunctionArgs) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, username")
    .eq("id", session.user.id)
    .single();

  const formData = await request.formData();
  const title = formData.get("title") as string;
  const tag = formData.get("category") as string;
  const body = formData.get("content") as string;

  if (!title?.trim() || !tag || !body?.trim()) {
    return { error: "All fields are required." };
  }

  const authorName = profile?.display_name || profile?.username || session.user.email || "Anonymous";
  const authorInitial = authorName.charAt(0).toUpperCase();

  const { error } = await supabase.from("posts").insert({
    title: title.trim(),
    body: body.trim(),
    tag,
    author: authorName,
    avatar: authorInitial,
    community: "r/threadly",
    upvotes: 0,
    user_id: session.user.id,
  });

  if (error) return { error: "Failed to create post: " + error.message };

  return redirect("/");
}

export default function CreatePost() {
  const actionData = useActionData<typeof clientAction>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-violet-600 mb-8 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to all posts
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1">
            Create a new post
          </h1>
          <p className="text-slate-500 text-sm">
            Share your knowledge, experience, or hot take with the community.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          {/* Form uses React Router's Form component — submits to the action above */}
          <Form method="post" className="flex flex-col gap-6">

            {/* Title field */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1.5">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                name="title"
                type="text"
                placeholder="Give your post a clear, descriptive title"
                maxLength={120}
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder:text-slate-400 text-slate-900"
              />
            </div>

            {/* Category field */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1.5">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                name="category"
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white text-slate-900"
              >
                <option value="">Select a category...</option>
                {CATEGORIES.filter((c) => c !== "All").map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Content field */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-slate-700 mb-1.5">
                Content <span className="text-red-500">*</span>
              </label>
              <textarea
                id="content"
                name="content"
                placeholder="Write your post here. Share your story, tips, or opinion..."
                rows={10}
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder:text-slate-400 text-slate-900 resize-y"
              />
            </div>

            {/* Error message from the action */}
            {actionData?.error && (
              <p className="text-red-500 text-sm">{actionData.error}</p>
            )}

            {/* Form actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <p className="text-xs text-slate-400">
                Fields marked <span className="text-red-500">*</span> are required
              </p>
              <div className="flex items-center gap-3">
                <Link to="/">
                  <Button type="button" variant="ghost">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                  {isSubmitting ? "Publishing..." : "Publish post"}
                </Button>
              </div>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}
