import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// 简单的临时文件生成函数
async function generateTempFile(size: number = 1024 * 10): Promise<{ path: string, content: Buffer }> {
  const content = Buffer.alloc(size, 'A');
  const filePath = path.join(process.cwd(), 'temp_test_file.txt');
  await fs.writeFile(filePath, content);
  return { path: filePath, content };
}

// 简单文本文件下载测试
export async function GET(request: Request) {
  try {
    // 从URL参数中获取所需的测试类型
    const url = new URL(request.url);
    const testType = url.searchParams.get('type') || 'text';
    const size = parseInt(url.searchParams.get('size') || '10240', 10);
    
    console.log(`处理API调试请求 - 类型: ${testType}, 大小: ${size} 字节`);
    
    // 根据测试类型返回不同的响应
    switch (testType) {
      case 'text': {
        // 创建一个简单的文本内容
        const content = 'Hello, this is a test download file.\n'.repeat(20);
        
        // 返回文本文件下载响应
        return new NextResponse(content, {
          headers: {
            'Content-Disposition': 'attachment; filename="test_download.txt"',
            'Content-Type': 'text/plain',
            'Content-Length': content.length.toString(),
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
      }
      
      case 'binary': {
        // 创建一个临时文件
        const { content } = await generateTempFile(size);
        
        // 返回二进制文件下载响应
        return new NextResponse(content, {
          headers: {
            'Content-Disposition': 'attachment; filename="test_binary.dat"',
            'Content-Type': 'application/octet-stream',
            'Content-Length': content.length.toString(),
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
      }
      
      case 'zip': {
        // 此处创建一个伪ZIP文件头的缓冲区
        // 真实ZIP文件开头的标识符是 PK\x03\x04
        const zipHeader = Buffer.from([0x50, 0x4B, 0x03, 0x04]);
        const zipContent = Buffer.concat([zipHeader, Buffer.alloc(size - 4)]);
        
        // 返回ZIP文件下载响应
        return new NextResponse(zipContent, {
          headers: {
            'Content-Disposition': 'attachment; filename="test_download.zip"',
            'Content-Type': 'application/zip',
            'Content-Length': zipContent.length.toString(),
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
      }
      
      case 'headers-only': {
        // 仅返回头信息但没有内容的响应，用于测试下载处理
        return new Response(null, {
          status: 200,
          headers: {
            'Content-Disposition': 'attachment; filename="empty_file.txt"',
            'Content-Type': 'text/plain',
            'Content-Length': '0',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
      }
      
      default:
        return NextResponse.json(
          { error: 'Unknown test type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('API调试路由出错:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 