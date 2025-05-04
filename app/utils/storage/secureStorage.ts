/**
 * 安全存储工具
 * 
 * 提供加密的本地存储功能，保护敏感用户数据
 */

const STORAGE_PREFIX = 'secure_';
const EXPIRATION_KEY_PREFIX = 'exp_';

// 加密密钥（在生产环境应使用环境变量）
const ENCRYPTION_KEY = 'eb795bcb7fe4a338a13c1dd739f8cc2b'; // 示例值，生产环境需替换

/**
 * 高级加密函数
 * 使用AES-GCM算法加密数据，提供更高的安全性
 */
async function encrypt(data: string): Promise<string> {
  try {
    if (typeof window === 'undefined') return '';
    
    // 随机初始化向量
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    // 将密钥字符串转换为密钥
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      hexToBuffer(ENCRYPTION_KEY),
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );
    
    // 加密数据
    const encodedData = new TextEncoder().encode(data);
    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      keyMaterial,
      encodedData
    );
    
    // 将IV和加密数据合并并转化为Base64字符串
    const result = new Uint8Array(iv.byteLength + encryptedData.byteLength);
    result.set(iv, 0);
    result.set(new Uint8Array(encryptedData), iv.byteLength);
    
    return bufferToBase64(result);
  } catch (error) {
    console.error('加密失败', error);
    return '';
  }
}

/**
 * 高级解密函数
 */
async function decrypt(encryptedData: string): Promise<string> {
  try {
    if (typeof window === 'undefined') return '';
    
    // 将Base64字符串转换为缓冲区
    const encryptedBuffer = base64ToBuffer(encryptedData);
    
    // 提取IV和加密数据
    const iv = encryptedBuffer.slice(0, 12);
    const data = encryptedBuffer.slice(12);
    
    // 将密钥字符串转换为密钥
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      hexToBuffer(ENCRYPTION_KEY),
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    
    // 解密数据
    const decryptedData = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv
      },
      keyMaterial,
      data
    );
    
    // 转换为字符串并返回
    return new TextDecoder().decode(decryptedData);
  } catch (error) {
    console.error('解密失败', error);
    return '';
  }
}

/**
 * 辅助函数：将十六进制字符串转换为缓冲区
 */
function hexToBuffer(hexString: string): Uint8Array {
  const bytes = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < hexString.length; i += 2) {
    bytes[i / 2] = parseInt(hexString.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * 辅助函数：将缓冲区转换为Base64字符串
 */
function bufferToBase64(buffer: Uint8Array): string {
  const binary = Array.from(buffer).map(byte => String.fromCharCode(byte)).join('');
  return btoa(binary);
}

/**
 * 辅助函数：将Base64字符串转换为缓冲区
 */
function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * 安全设置带过期时间的项目
 * 
 * @param key 存储键
 * @param value 存储值
 * @param expirationMs 过期时间（毫秒）
 * @returns 是否保存成功
 */
export async function setSecureItem(key: string, value: string, expirationMs?: number): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  try {
    // 加密数据
    const encryptedValue = await encrypt(value);
    if (!encryptedValue) return false;
    
    // 存储加密数据
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, encryptedValue);
    
    // 如果设置了过期时间，存储过期时间
    if (expirationMs) {
      const expirationTime = Date.now() + expirationMs;
      localStorage.setItem(`${EXPIRATION_KEY_PREFIX}${key}`, expirationTime.toString());
    }
    
    return true;
  } catch (error) {
    console.error(`无法安全存储 ${key}`, error);
    return false;
  }
}

/**
 * 安全获取项目，自动检查过期时间
 * 
 * @param key 存储键
 * @returns 存储的值，如果已过期或不存在则返回null
 */
export async function getSecureItem(key: string): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  
  try {
    // 检查是否过期
    const expirationTimeStr = localStorage.getItem(`${EXPIRATION_KEY_PREFIX}${key}`);
    
    if (expirationTimeStr) {
      const expirationTime = parseInt(expirationTimeStr, 10);
      
      // 如果已过期，清除数据并返回null
      if (Date.now() > expirationTime) {
        removeSecureItem(key);
        return null;
      }
    }
    
    // 获取加密数据
    const encryptedValue = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    
    if (!encryptedValue) return null;
    
    // 解密并返回
    return await decrypt(encryptedValue);
  } catch (error) {
    console.error(`无法检索安全项目 ${key}`, error);
    return null;
  }
}

/**
 * 安全移除项目
 * 
 * @param key 存储键
 * @returns 是否移除成功
 */
export function removeSecureItem(key: string): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
    localStorage.removeItem(`${EXPIRATION_KEY_PREFIX}${key}`);
    return true;
  } catch (error) {
    console.error(`无法移除安全项目 ${key}`, error);
    return false;
  }
}

/**
 * 清理所有过期项目
 */
export function cleanupExpiredItems(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const now = Date.now();
    
    // 查找所有过期键
    Object.keys(localStorage)
      .filter(key => key.startsWith(EXPIRATION_KEY_PREFIX))
      .forEach(expirationKey => {
        const expirationTime = parseInt(localStorage.getItem(expirationKey) || '0', 10);
        
        if (now > expirationTime) {
          // 提取实际的键名
          const actualKey = expirationKey.substring(EXPIRATION_KEY_PREFIX.length);
          removeSecureItem(actualKey);
        }
      });
  } catch (error) {
    console.error('无法清理过期项目', error);
  }
}

// 存储配置
export const STORAGE_CONFIG = {
  // 键名
  KEYS: {
    AUTH_FORM_DATA: 'auth_form_data',
    REGISTERED_EMAIL: 'registered_email',
    USER_PREFERENCES: 'user_preferences',
    THEME: 'theme'
  },
  
  // 过期时间（毫秒）
  EXPIRATION: {
    SHORT: 15 * 60 * 1000, // 15分钟
    MEDIUM: 24 * 60 * 60 * 1000, // 24小时
    LONG: 7 * 24 * 60 * 60 * 1000 // 7天
  }
}; 