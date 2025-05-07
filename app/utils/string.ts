/**
 * 字符串工具函数
 */

/**
 * 生成指定长度的随机字符串
 * @param length 随机字符串长度
 * @param charset 字符集，默认为字母数字组合
 * @returns 随机字符串
 */
export function randomString(length: number, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'): string {
  let result = '';
  const charsetLength = charset.length;
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charsetLength);
    result += charset.charAt(randomIndex);
  }
  
  return result;
}

/**
 * 将字符串转换为驼峰命名法
 * @param str 原始字符串
 * @returns 驼峰命名的字符串
 */
export function toCamelCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, c => c.toLowerCase());
}

/**
 * 将字符串转换为短横线命名法
 * @param str 原始字符串
 * @returns 短横线命名的字符串
 */
export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
} 