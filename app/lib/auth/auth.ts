import { PrismaAdapter } from "@auth/prisma-adapter"
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GitHubProvider from "next-auth/providers/github"
import { prisma } from "./prisma"
import { OAuth2Client } from "google-auth-library"
import { compare } from "bcrypt"

// 创建基本的OAuth客户端
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

if (!process.env.GITHUB_ID || !process.env.GITHUB_SECRET) {
  throw new Error('Please define GITHUB_ID and GITHUB_SECRET environment variables');
}

// 确保prisma实例是可用的
if (!prisma) {
  throw new Error('Prisma client is not initialized properly');
}

// 用于调试的辅助函数，添加环境判断
function logObject(prefix: string, obj: any) {
  // 只在开发环境下输出日志
  if (process.env.NODE_ENV === 'development' && process.env.DEBUG_AUTH === 'true') {
    console.log(`${prefix}:`, JSON.stringify(obj, null, 2));
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
      httpOptions: {
        timeout: 10000
      },
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
        }
      },
    }),
    CredentialsProvider({
      id: "credentials",
      name: "邮箱密码",
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("请提供邮箱和密码");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user) {
          throw new Error("用户不存在");
        }

        if (!user.password) {
          throw new Error("未设置密码，请使用第三方登录");
        }

        const isPasswordValid = await compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error("密码错误");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      }
    }),
    CredentialsProvider({
      id: "google",
      name: "Google",
      credentials: {
        credential: { type: "text" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.credential) return null;

          let ticket;
          try {
            // 增加错误处理，捕获特定网络错误
            ticket = await googleClient.verifyIdToken({
              idToken: credentials.credential,
              audience: process.env.GOOGLE_CLIENT_ID
            });
          } catch (verifyError) {
            console.error("Google token verification error:", verifyError);
            // 检查是否为网络错误
            if (verifyError.message && (
              verifyError.message.includes('ETIMEDOUT') || 
              verifyError.message.includes('Failed to retrieve verification certificates')
            )) {
              throw new Error("Google认证服务暂时不可用，可能需要代理才能访问Google服务");
            }
            throw verifyError;
          }

          const payload = ticket.getPayload();
          if (!payload) return null;
          
          // 确保邮箱存在
          if (!payload.email) {
            throw new Error("Google账号未提供邮箱");
          }

          // 检查用户是否存在
          let user = await prisma.user.findUnique({
            where: { email: payload.email }
          });

          if (!user) {
            // 创建新用户
            user = await prisma.user.create({
              data: {
                email: payload.email,
                name: payload.name || payload.email.split('@')[0], // 使用邮箱前缀作为备用名称
                password: "",
              }
            });
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        } catch (error) {
          console.error("Error in authorize callback:", error);
          // 向客户端返回更友好的错误信息
          throw new Error(error instanceof Error ? error.message : "Google登录失败");
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "github") {
        try {
          // 检查用户是否存在
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! }
          });

          if (!existingUser) {
            // 创建新用户
            await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name,
                password: "",
              }
            });
          }
          return true;
        } catch (error) {
          console.error("Error in signIn callback:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // 简化日志输出
      if (process.env.NODE_ENV === 'development' && process.env.DEBUG_AUTH === 'true') {
        console.log(`JWT回调处理中...`);
      }
      
      if (user) {
        token.id = user.id;
        token.userId = user.id; // 添加备用字段
      }
      
      if (account) {
        token.accessToken = account.access_token;
      }
      
      return token;
    },
    async session({ session, token }) {
      // 简化日志输出
      if (process.env.NODE_ENV === 'development' && process.env.DEBUG_AUTH === 'true') {
        console.log(`Session回调处理中...`);
      }
      
      if (session.user && token) {
        // 确保用户ID被正确设置
        const userId = (token.id as string) || (token.userId as string) || token.sub;
        if (userId) {
          session.user.id = userId;
        } else {
          console.error('警告: 无法找到有效的用户ID!');
        }
      }
      
      return session;
    },
    async redirect({ url, baseUrl }) {
      // 简化日志输出
      if (process.env.NODE_ENV === 'development' && process.env.DEBUG_AUTH === 'true') {
        console.log(`重定向处理: ${url} -> ${baseUrl}/file-management/main`);
      }
      
      // 始终重定向到文件管理页面
      return `${baseUrl}/file-management/main`;
    }
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  debug: process.env.NODE_ENV === 'development',
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
}; 