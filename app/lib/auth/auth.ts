import { PrismaAdapter } from "@auth/prisma-adapter"
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/app/lib/database"
import { AUTH_CONSTANTS, AUTH_ERROR_CODE } from "@/app/constants/auth"
import { verifyCredentials } from "./credentials-service"
import { logAuthError } from "@/app/lib/error/auth-error"

// 确保prisma实例是可用的
if (!prisma) {
  throw new Error('Prisma client is not initialized properly');
}

/**
 * NextAuth配置选项
 * 
 * 负责NextAuth认证系统配置，不处理业务逻辑
 */
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      id: AUTH_CONSTANTS.PROVIDERS.CREDENTIALS,
      name: "邮箱密码",
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("请提供邮箱和密码");
          }

          // 使用凭据验证服务
          return await verifyCredentials(
            credentials.email,
            credentials.password
          );
        } catch (error) {
          // 使用统一错误处理
          logAuthError(error, 'credentials-authorize');
          throw error;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account }) {      
      if (user) {
        token.id = user.id;
        token.userId = user.id; // 添加备用字段
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        // 确保用户ID被正确设置
        const userId = (token.id as string) || (token.userId as string) || token.sub;
        if (userId) {
          session.user.id = userId;
        } else {
          logAuthError('无法找到有效的用户ID', 'session-callback');
        }
      }
      
      return session;
    },
    async redirect({ url, baseUrl }) {
      // 默认重定向路径
      return url.startsWith(baseUrl)
        ? url
        : `${baseUrl}${AUTH_CONSTANTS.ROUTES.DEFAULT_SUCCESS}`;
    }
  },
  pages: {
    error: AUTH_CONSTANTS.ROUTES.ERROR,
  },
  debug: process.env.NODE_ENV === 'development',
  session: {
    strategy: "jwt",
    maxAge: AUTH_CONSTANTS.SESSION.MAX_AGE, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
}; 