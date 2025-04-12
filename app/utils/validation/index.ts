/**
 * 验证工具函数集中导出
 * 
 * 提供常用的数据验证功能
 */

/**
 * 验证电子邮件格式
 * @param email 要验证的电子邮件地址
 * @returns 如果格式正确返回true，否则返回false
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 验证URL格式
 * @param url 要验证的URL
 * @returns 如果格式正确返回true，否则返回false
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * 验证密码强度
 * @param password 要验证的密码
 * @returns 包含验证结果和强度信息的对象
 */
export const validatePassword = (password: string): { 
  isValid: boolean; 
  strength: 'weak' | 'medium' | 'strong'; 
  message: string; 
} => {
  if (!password || password.length < 8) {
    return { 
      isValid: false, 
      strength: 'weak', 
      message: '密码长度至少为8个字符' 
    };
  }

  // 检查密码强度
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  let message = '';
  
  // 包含数字
  const hasNumber = /\d/.test(password);
  // 包含小写字母
  const hasLowercase = /[a-z]/.test(password);
  // 包含大写字母
  const hasUppercase = /[A-Z]/.test(password);
  // 包含特殊字符
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if ((hasNumber && hasLowercase) || (hasLowercase && hasUppercase) || (hasNumber && hasSpecial)) {
    strength = 'medium';
    message = '密码强度适中';
  }
  
  if (hasNumber && hasLowercase && hasUppercase && hasSpecial && password.length >= 12) {
    strength = 'strong';
    message = '密码强度很高';
  } else if (strength === 'weak') {
    message = '密码强度较弱，建议包含数字、大小写字母和特殊字符';
  }
  
  return {
    isValid: true,
    strength,
    message
  };
}; 