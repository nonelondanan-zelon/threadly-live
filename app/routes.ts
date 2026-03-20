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

  // Auth pages
  route("login", "routes/login.tsx"),
  route("signup", "routes/signup.tsx"),
] satisfies RouteConfig;
