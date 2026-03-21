// This file registers all the pages (routes) in the app.
// React Router reads this to know which component to show for each URL.
import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // "/" → Home page (post grid)
  index("routes/home.tsx"),

  // "/post/1", "/post/2", etc. → Post Detail page
  route("post/:id", "routes/post.$id.tsx"),

  // "/create" → Create Post page
  route("create", "routes/create.tsx"),

  // "/api/like" → Resource route for liking posts and comments
  route("api/like", "routes/api.like.tsx"),

  // "/profile" → Profile view page (protected)
  route("profile", "routes/profile.tsx"),

  // "/profile/edit" → Edit profile form (protected)
  route("profile/edit", "routes/profile.edit.tsx"),

  // Auth pages
  route("login", "routes/login.tsx"),
  route("forgot-password", "routes/forgot-password.tsx"),
  route("reset-password", "routes/reset-password.tsx"),
  route("signup", "routes/signup.tsx"),
  route("auth/callback", "routes/auth.callback.tsx"),
] satisfies RouteConfig;
