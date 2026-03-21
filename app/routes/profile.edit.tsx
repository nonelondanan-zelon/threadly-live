import { Form, useLoaderData, useNavigation, useActionData, redirect } from "react-router";
import type { ClientActionFunctionArgs } from "react-router";
import { supabase } from "~/lib/supabase";

// Fetch all existing profile fields to pre-fill the form
export async function clientLoader() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, bio, username, location, website")
    .eq("id", session.user.id)
    .single();

  return { user: session.user, profile };
}

// Save all fields and redirect to view page
export async function clientAction({ request }: ClientActionFunctionArgs) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return redirect("/login");

  const formData = await request.formData();
  const display_name = formData.get("display_name") as string;
  const username = formData.get("username") as string;
  const bio = formData.get("bio") as string;
  const location = formData.get("location") as string;
  const website = formData.get("website") as string;
  const avatarFile = formData.get("avatar") as File;

  // Start with existing avatar_url — only overwrite if user picked a new file
  let avatar_url: string | undefined = undefined;

  if (avatarFile && avatarFile.size > 0) {
    // Use the user's ID as the filename so it always overwrites their old avatar
    const fileExt = avatarFile.name.split(".").pop();
    const filePath = `${session.user.id}.${fileExt}`;

    // Upload the image to the "Avatars" bucket in Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("Avatars")
      .upload(filePath, avatarFile, { upsert: true });

    if (uploadError) return { error: "Failed to upload avatar: " + uploadError.message };

    // Get the public URL so we can save it to the profile
    const { data: { publicUrl } } = supabase.storage
      .from("Avatars")
      .getPublicUrl(filePath);

    avatar_url = publicUrl;
  }

  const { error } = await supabase
    .from("profiles")
    .upsert({
      id: session.user.id,
      display_name,
      username,
      bio,
      location,
      website,
      ...(avatar_url && { avatar_url }),
    });

  if (error) return { error: "Failed to save profile: " + error.message };

  return redirect("/profile");
}

export function meta() {
  return [{ title: "Edit Profile — Threadly" }];
}

export default function ProfileEdit() {
  const { user, profile } = useLoaderData<typeof clientLoader>();
  const actionData = useActionData<typeof clientAction>();
  const navigation = useNavigation();
  const isSaving = navigation.state === "submitting";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1">Edit Profile</h1>
          <p className="text-slate-500 text-sm">{user.email}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <Form method="post" encType="multipart/form-data" className="flex flex-col gap-6">

            {/* Avatar upload */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Profile Photo
              </label>
              <input
                type="file"
                name="avatar"
                accept="image/*"
                className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
              />
              <p className="text-xs text-slate-400 mt-1">JPG, PNG or GIF. Leave empty to keep current photo.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="display_name" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Display Name
                </label>
                <input
                  id="display_name"
                  name="display_name"
                  type="text"
                  defaultValue={profile?.display_name ?? ""}
                  placeholder="Your full name"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">@</span>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    defaultValue={profile?.username ?? ""}
                    placeholder="yourhandle"
                    className="w-full pl-7 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-slate-700 mb-1.5">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                defaultValue={profile?.bio ?? ""}
                placeholder="Tell the community a bit about yourself..."
                rows={4}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-y"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Location
                </label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  defaultValue={profile?.location ?? ""}
                  placeholder="New York, Remote..."
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label htmlFor="website" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Website
                </label>
                <input
                  id="website"
                  name="website"
                  type="url"
                  defaultValue={profile?.website ?? ""}
                  placeholder="https://yoursite.com"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>

            {actionData?.error && (
              <p className="text-red-500 text-sm">{actionData.error}</p>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <a href="/profile" className="text-sm text-slate-500 hover:text-slate-700">
                Cancel
              </a>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
              >
                {isSaving ? "Saving..." : "Save profile"}
              </button>
            </div>

          </Form>
        </div>

      </div>
    </div>
  );
}
