import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
});

export const config = {
  matcher: [
    "/api/files/:path*",
    "/api/folders/:path*",
    "/api/shares/:path*",
    "/api/users/:path*",
    "/file_management/:path*",
  ],
}; 