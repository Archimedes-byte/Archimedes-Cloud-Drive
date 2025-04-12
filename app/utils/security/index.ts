/**
 * 安全工具函数集中导出
 * 
 * 提供安全相关功能，如加密、哈希等
 */

/**
 * 生成随机字符串
 * @param length 生成的字符串长度
 * @returns 随机字符串
 */
export const generateRandomString = (length: number = 16): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomValues = new Uint8Array(length);
  
  if (typeof window !== 'undefined' && window.crypto) {
    // 浏览器环境使用Web Crypto API
    window.crypto.getRandomValues(randomValues);
  } else {
    // Node.js环境或其他环境使用Math.random (不太安全，仅作为降级方案)
    for (let i = 0; i < length; i++) {
      randomValues[i] = Math.floor(Math.random() * 256);
    }
  }
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(randomValues[i] % chars.length);
  }
  
  return result;
};

/**
 * 过滤HTML内容，防止XSS攻击
 * @param html 包含HTML的字符串
 * @returns 过滤后的安全字符串
 */
export const sanitizeHtml = (html: string): string => {
  // 简单实现，生产环境建议使用DOMPurify等专业库
  return html
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * 检测输入是否包含潜在的危险内容
 * @param input 要检查的输入
 * @returns 是否包含危险内容
 */
export const containsPotentialMaliciousContent = (input: string): boolean => {
  // 检测常见的注入模式
  const patterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // Script标签
    /javascript\s*:/gi, // JavaScript协议
    /on\w+\s*=/gi, // 内联事件处理程序
    /(\b)(on\S+)(\s*)=/gi, // 另一种内联事件模式
    /\/\*|\*\/|--|#|\\/gi, // SQL注入常见模式
    /((\%3C)|<)((\%2F)|\/)*[a-z0-9\%]+((\%3E)|>)/gi, // HTML标签
  ];
  
  return patterns.some(pattern => pattern.test(input));
};

/**
 * 对输入数据进行基本转义
 * @param input 要转义的输入字符串
 * @returns 转义后的字符串
 */
export const escapeUserInput = (input: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return input.replace(/[&<>"']/g, (m) => map[m]);
}; 