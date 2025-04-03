import { PrismaAdapter } from "@auth/prisma-adapter"
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GitHubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "@/lib/prisma"
import { OAuth2Client } from "google-auth-library"
import { HttpsProxyAgent } from "https-proxy-agent"
import bcrypt from "bcryptjs"
import * as https from 'https'

// GitHub Profile 类型定义
interface GitHubProfile {
  login: string;
  id: number;
  avatar_url: string;
  name: string | null;
  email: string | null;
}

// 创建代理配置
const proxyUrl = process.env.HTTPS_PROXY || 'http://127.0.0.1:7890';
// 兼容性处理 - 使用正确的代理实例化方式
let proxyAgent;
try {
  proxyAgent = new HttpsProxyAgent(proxyUrl);
  console.log('代理已成功配置:', proxyUrl);
} catch (err) {
  console.error('代理配置失败:', err);
  // 如果代理设置失败，使用普通 HTTPS Agent
  proxyAgent = new https.Agent({ 
    rejectUnauthorized: process.env.NODE_ENV !== 'development',
    keepAlive: true,
    timeout: 30000 // 增加超时时间
  });
}

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

if (!process.env.GITHUB_ID || !process.env.GITHUB_SECRET) {
  throw new Error("GitHub OAuth 配置缺失");
}

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error("Google OAuth 配置缺失");
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
      // 添加更可靠的HTTP选项
      httpOptions: {
        timeout: 30000,  // 增加超时时间为30秒
        agent: proxyAgent // 使用代理
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      httpOptions: {
        timeout: 30000,  // 增加超时时间为30秒
        agent: proxyAgent // 使用代理
      }
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "邮箱", type: "text" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("请输入邮箱和密码");
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user || !user.password) {
          throw new Error("用户不存在");
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValid) {
          throw new Error("密码错误");
        }

        return user;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        console.log('登录回调:', { user, account, profile });
        return true;
      } catch (error) {
        console.error('登录回调异常:', error);
        return true; // 即使出错也允许继续
      }
    },
    async jwt({ token, user, account }) {
      console.log('JWT 回调:', { token, user, account });
      if (account) {
        token.id = user.id;
        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, token }) {
      console.log('会话回调:', { session, token });
      if (session.user) {
        session.user.id = token.id as string;
        session.user.provider = token.provider as string;
      }
      console.log('会话事件:', { session, token });
      return session;
    },
    async redirect({ url, baseUrl }) {
      console.log('重定向回调:', { url, baseUrl });
      
      // 检测是否是授权成功后的回调
      if (url.includes('/api/auth/callback/') || url.includes('/auth/login')) {
        console.log('授权成功，重定向到文件管理页面');
        return `${baseUrl}/file_management/main`;
      }
      
      // 如果是相对路径，添加基础URL
      if (url.startsWith('/')) {
        url = `${baseUrl}${url}`;
      }
      
      // 如果是外部URL且不在允许列表中，重定向到默认页面
      if (!url.startsWith(baseUrl)) {
        return `${baseUrl}/file_management/main`;
      }
      
      console.log('重定向到:', url);
      return url;
    },
  },
  debug: process.env.NODE_ENV === 'development',
}; 