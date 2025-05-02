import { withAuth } from "next-auth/middleware";

/**
 * 身份验证中间件
 * 保护需要登录的页面和API路由
 */
export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  }
});

export const config = {
  matcher: [
    // 需要身份验证的路径
    "/api/storage/:path*",
    "/api/shares/:path*",
    "/api/users/:path*",
    "/file-management/:path*",
  ],
}; 