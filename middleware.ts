import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
});

export const config = {
  matcher: [
    "/api/storage/:path*",
    "/api/shares/:path*",
    "/api/users/:path*",
    "/file-management/:path*",
  ],
}; 