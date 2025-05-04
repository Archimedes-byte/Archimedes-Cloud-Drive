import NextAuth from 'next-auth';
import { authOptions } from '@/app/lib/auth';

// 使用NextAuth处理所有认证相关请求
const handler = NextAuth(authOptions);

// 明确导出所有必要的HTTP方法处理器
export { handler as GET, handler as POST, handler as DELETE, handler as HEAD, handler as PATCH }; 