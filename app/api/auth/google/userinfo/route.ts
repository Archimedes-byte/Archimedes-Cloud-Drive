import { NextResponse } from 'next/server';
import { verifyGoogleToken } from '@/app/lib/google-auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const credential = searchParams.get('credential');

    if (!credential) {
      return NextResponse.json(
        { error: '未提供 credential' },
        { status: 400 }
      );
    }

    const googleUser = await verifyGoogleToken(credential);

    if (!googleUser) {
      return NextResponse.json(
        { error: '无效的 credential' },
        { status: 400 }
      );
    }

    return NextResponse.json(googleUser);
  } catch (error) {
    console.error('Google userinfo error:', error);
    return NextResponse.json(
      { error: '处理 Google 用户信息时出错' },
      { status: 500 }
    );
  }
} 