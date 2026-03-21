import type { ClientActionFunctionArgs } from "react-router";
import { supabase } from "~/lib/supabase";

export async function clientAction({ request }: ClientActionFunctionArgs) {
  const formData = await request.formData();
  const type = formData.get("type") as string;   // "post" or "comment"
  const id = formData.get("id") as string;
  const intent = formData.get("intent") as string; // "like" or "unlike"

  if (type === "post") {
    const { data } = await supabase
      .from("posts")
      .select("upvotes")
      .eq("id", id)
      .single();

    if (data) {
      const newCount = intent === "unlike"
        ? Math.max(0, data.upvotes - 1)
        : data.upvotes + 1;
      await supabase.from("posts").update({ upvotes: newCount }).eq("id", id);
    }
  } else if (type === "comment") {
    const { data } = await supabase
      .from("comments")
      .select("likes")
      .eq("id", id)
      .single();

    if (data) {
      const newCount = intent === "unlike"
        ? Math.max(0, data.likes - 1)
        : data.likes + 1;
      await supabase.from("comments").update({ likes: newCount }).eq("id", id);
    }
  }

  return { success: true };
}
