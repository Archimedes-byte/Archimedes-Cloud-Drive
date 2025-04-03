import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    console.log('中间件处理:', {
      path: req.nextUrl.pathname,
      hasToken: !!req.nextauth.token,
      token: req.nextauth.token
    });

    // 处理OAuth错误页面，重定向到登录页面并显示错误信息
    if (req.nextUrl.pathname.includes('/auth/error')) {
      const errorType = req.nextUrl.searchParams.get('error');
      console.log('认证错误：', errorType);
      
      // 检查是否是网络连接错误
      if (errorType?.includes('ECONNRESET') || errorType?.includes('SIGNIN_OAUTH_ERROR')) {
        console.log('检测到网络连接错误，将尝试自动重新连接');
        // 让错误页面自己处理，它会提供重试选项
      }
      
      // 不再重定向，让错误页面自己处理显示
      return NextResponse.next();
    }

    // 如果已经登录，访问登录页面时重定向到文件管理页面
    if (req.nextUrl.pathname === '/auth/login' && req.nextauth.token) {
      console.log('已登录用户访问登录页面，重定向到文件管理页面');
      return NextResponse.redirect(new URL('/file_management/main', req.url));
    }

    // 如果是OAuth回调路径且有token，重定向到文件管理页面
    if (req.nextUrl.pathname.includes('/api/auth/callback/') && req.nextauth.token) {
      console.log('OAuth回调成功，重定向到文件管理页面');
      return NextResponse.redirect(new URL('/file_management/main', req.url));
    }

    // 如果未登录，访问受保护页面时重定向到登录页面
    if (!req.nextauth.token && req.nextUrl.pathname.startsWith('/file_management/')) {
      console.log('未登录用户访问受保护页面，重定向到登录页面');
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        console.log('授权检查:', {
          path,
          hasToken: !!token,
          token
        });

        // 登录相关页面不需要验证
        if (path.startsWith('/auth/')) {
          return true;
        }

        // API 和文件管理页面需要验证
        if (
          path.startsWith('/api/') ||
          path.startsWith('/file_management/')
        ) {
          return !!token;
        }

        // 其他页面不需要验证
        return true;
      },
    },
    pages: {
      signIn: '/auth/login',
      error: '/auth/error',
    },
  }
);

export const config = {
  matcher: [
    "/api/files/:path*",
    "/api/folders/:path*",
    "/api/shares/:path*",
    "/api/users/:path*",
    "/file_management/:path*",
    "/auth/login",
    "/auth/error",
    "/api/auth/callback/:path*",
  ],
}; 