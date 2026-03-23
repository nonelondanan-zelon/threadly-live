// Types that match the real Supabase database columns exactly.
// No more mock data — all data comes from the database.

export interface Comment {
  id: number;
  post_id: number;
  author: string;
  avatar: string;   // Single letter used as avatar initial
  body: string;
  likes: number;
  created_at: string;
}

export interface Post {
  id: number;
  title: string;
  body: string;       // Full post text
  author: string;
  avatar: string;     // Single letter used as avatar initial
  community: string;  // e.g. r/webdev
  tag: string;        // e.g. Discussion, Career, Tips
  upvotes: number;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;       // post author — who receives it
  actor_id: string | null; // commenter — who triggered it
  type: string;          // 'new_comment'
  post_id: number;
  comment_id: number | null;
  message: string;       // e.g. "Alex commented on your post"
  is_read: boolean;
  created_at: string;
}

// Categories for the filter tabs — "All" plus every tag used in the database
export const CATEGORIES = ["All", "Discussion", "Tips", "Career", "Show HN", "News", "Help"];
