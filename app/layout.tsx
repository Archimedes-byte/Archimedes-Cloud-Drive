import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import './styles/variables.css';
import Providers from './providers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth/auth';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Cloud Drive',
  description: 'Your personal cloud storage solution',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/symbol.png" />
        <title>Archimedes' Cloud Drive</title>
        {/* 添加关键样式预置，避免样式闪烁 */}
        <style dangerouslySetInnerHTML={{ __html: `
          /* 确保密码输入框样式立即生效 */
          .ant-input-affix-wrapper {
            border-radius: 8px !important;
            transition: all 0.3s ease !important;
          }
          
          .ant-input-affix-wrapper:hover {
            border-color: #3b82f6 !important;
          }
          
          .ant-input-affix-wrapper-focused,
          .ant-input-affix-wrapper:focus {
            border-color: #3b82f6 !important;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2) !important;
            outline: 0 !important;
          }
          
          .ant-input-password-icon {
            color: #6b7280 !important;
          }
        ` }} />
      </head>
      <body className={inter.className}>
        <Providers session={session}>
          {children}
        </Providers>
      </body>
    </html>
  );
} 