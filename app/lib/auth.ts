import { PrismaAdapter } from "@auth/prisma-adapter"
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GitHubProvider from "next-auth/providers/github"
import { prisma } from "./prisma"
import { OAuth2Client } from "google-auth-library"
import { compare } from "bcrypt"

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

if (!process.env.GITHUB_ID || !process.env.GITHUB_SECRET) {
  throw new Error('Please define GITHUB_ID and GITHUB_SECRET environment variables');
}

// 确保prisma实例是可用的
if (!prisma) {
  throw new Error('Prisma client is not initialized properly');
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

          // 验证 Google ID token
          const ticket = await googleClient.verifyIdToken({
            idToken: credentials.credential,
            audience: process.env.GOOGLE_CLIENT_ID
          });

          const payload = ticket.getPayload();
          if (!payload) return null;

          // 检查用户是否存在
          let user = await prisma.user.findUnique({
            where: { email: payload.email }
          });

          if (!user) {
            // 创建新用户
            user = await prisma.user.create({
              data: {
                email: payload.email!,
                name: payload.name,
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
          return null;
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
      if (user) {
        token.id = user.id;
      }
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      console.log('重定向 URL:', url);
      console.log('基础 URL:', baseUrl);
      
      // 始终重定向到文件管理页面
      return `${baseUrl}/file_management/main`;
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