import { NextRequest, NextResponse } from 'next/server';

/**
 * 下载辅助API，帮助处理浏览器安全策略阻止的下载
 * 接收base64编码的文件数据并触发下载响应
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const fileData = formData.get('fileData') as string;
    const fileName = formData.get('fileName') as string || '下载文件.zip';
    
    // 验证数据完整性
    if (!fileData) {
      return NextResponse.json({ error: '缺少文件数据' }, { status: 400 });
    }
    
    // 将base64数据转换回二进制
    const binaryData = Buffer.from(fileData, 'base64');
    
    // 创建下载响应
    return new NextResponse(binaryData, {
      headers: {
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
        'Content-Type': fileName.toLowerCase().endsWith('.zip') ? 'application/zip' : 'application/octet-stream',
        'Content-Length': binaryData.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('下载辅助API错误:', error);
    return NextResponse.json({ error: '下载处理失败' }, { status: 500 });
  }
} 