/**
 * 频率限制中间件
 * 
 * 用于限制API请求频率，防止暴力攻击
 */
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

// 存储请求IP和时间的缓存
interface RequestInfo {
  count: number;
  firstRequest: number;
  blocked: boolean;
  blockUntil?: number;
}

// 内存中的简单存储
const ipCache = new Map<string, RequestInfo>();

// 定期清理过期的IP记录
const CLEANUP_INTERVAL = 10 * 60 * 1000; // 10分钟
setInterval(() => {
  const now = Date.now();
  for (const [ip, info] of ipCache.entries()) {
    // 移除15分钟前的记录或者解除屏蔽已经过期的IP
    if ((now - info.firstRequest > 15 * 60 * 1000) || 
        (info.blocked && info.blockUntil && now > info.blockUntil)) {
      ipCache.delete(ip);
    }
  }
}, CLEANUP_INTERVAL);

/**
 * 创建频率限制中间件
 * 
 * @param maxRequests 时间窗口内允许的最大请求数
 * @param windowMs 时间窗口（毫秒）
 * @param blockDuration 被阻止的持续时间（毫秒）
 */
export function createRateLimit(
  maxRequests: number = 5,
  windowMs: number = 60 * 1000, // 默认1分钟
  blockDuration: number = 15 * 60 * 1000 // 默认15分钟
) {
  return async function rateLimit(
    req: NextRequest,
    next: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    // 获取请求IP
    const ip = (headers().get('x-forwarded-for') || '未知IP').split(',')[0].trim();
    
    // 获取当前时间
    const now = Date.now();
    
    // 获取或创建IP信息
    let info = ipCache.get(ip);
    if (!info) {
      info = { count: 0, firstRequest: now, blocked: false };
      ipCache.set(ip, info);
    }
    
    // 检查是否被阻止
    if (info.blocked) {
      if (info.blockUntil && now > info.blockUntil) {
        // 解除阻止
        info.blocked = false;
        info.count = 1;
        info.firstRequest = now;
      } else {
        // 返回429状态码
        return new NextResponse(
          JSON.stringify({
            success: false,
            error: '请求过于频繁，请稍后再试',
            retryAfter: info.blockUntil ? Math.ceil((info.blockUntil - now) / 1000) : 900
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': info.blockUntil ? String(Math.ceil((info.blockUntil - now) / 1000)) : '900'
            }
          }
        );
      }
    }
    
    // 检查是否在时间窗口内
    if (now - info.firstRequest > windowMs) {
      // 重置计数器
      info.count = 1;
      info.firstRequest = now;
    } else {
      // 增加计数器
      info.count++;
      
      // 检查是否超过限制
      if (info.count > maxRequests) {
        // 标记为阻止
        info.blocked = true;
        info.blockUntil = now + blockDuration;
        
        // 返回429状态码
        return new NextResponse(
          JSON.stringify({
            success: false,
            error: '请求过于频繁，请稍后再试',
            retryAfter: Math.ceil(blockDuration / 1000)
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': String(Math.ceil(blockDuration / 1000))
            }
          }
        );
      }
    }
    
    // 继续处理请求
    return next();
  };
}

// 针对身份验证的更严格限制
export const authRateLimit = createRateLimit(5, 60 * 1000, 15 * 60 * 1000);

// 针对一般API的常规限制
export const apiRateLimit = createRateLimit(20, 60 * 1000, 5 * 60 * 1000); 