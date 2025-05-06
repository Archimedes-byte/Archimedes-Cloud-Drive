/**
 * 后端认证服务
 * 
 * 提供服务端使用的统一认证功能，避免重复代码
 */
import bcrypt from 'bcrypt';
import { AUTH_ERROR_CODE } from '@/app/constants/auth';
import { 
  createAuthError,
  logAuthError,
  getFriendlyErrorMessage
} from '@/app/lib/error/auth-error';
import { emailSchema, passwordSchema } from '@/app/lib/validation/schemas';
import { 
  findUserByEmail,
  createUser,
  getUserBasicById
} from './user-service';
import { UserBasic } from '@/app/types';
import { toUserBasic } from '@/app/utils/user/transform';

/**
 * 哈希密码
 * 注意：bcrypt.hash 方法已经内部生成随机盐值，不需要手动指定
 * 安全最佳实践：使用随机盐值且轮数至少为12
 */
export async function hashPassword(password: string): Promise<string> {
  // bcrypt会自动生成随机盐值，这里只需要指定轮数
  return bcrypt.hash(password, 12);
}

/**
 * 验证用户凭据
 */
export async function verifyCredentials(
  email: string,
  password: string
): Promise<UserBasic> {
  // 验证输入
  try {
    emailSchema.parse(email);
  } catch (error) {
    throw createAuthError(
      '请输入有效的邮箱地址',
      AUTH_ERROR_CODE.INVALID_CREDENTIALS
    );
  }

  if (!password) {
    throw createAuthError(
      '请输入密码',
      AUTH_ERROR_CODE.INVALID_CREDENTIALS
    );
  }

  // 查找用户
  const user = await findUserByEmail(email);

  if (!user) {
    // 安全起见，无论用户是否存在，都返回相同的错误消息
    // 这样可以防止攻击者通过错误消息枚举有效的邮箱地址
    throw createAuthError(
      '邮箱或密码不正确',
      AUTH_ERROR_CODE.INVALID_CREDENTIALS
    );
  }

  // 检查用户是否设置了密码
  if (!user.password) {
    throw createAuthError(
      '未设置密码，请使用第三方登录',
      AUTH_ERROR_CODE.INVALID_CREDENTIALS
    );
  }

  // 验证密码 - 使用恒定时间比较避免计时攻击
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    // 同样使用通用错误消息
    throw createAuthError(
      '邮箱或密码不正确',
      AUTH_ERROR_CODE.INVALID_CREDENTIALS
    );
  }

  // 返回基本用户信息
  return toUserBasic(user);
}

/**
 * 注册用户
 */
export async function registerUser(data: {
  email: string;
  password: string;
  name?: string;
}): Promise<UserBasic> {
  try {
    // 验证邮箱和密码
    emailSchema.parse(data.email);
    passwordSchema.parse(data.password);
    
    // 检查邮箱是否已存在
    const existingUser = await findUserByEmail(data.email);
    if (existingUser) {
      throw createAuthError('邮箱已被注册', AUTH_ERROR_CODE.EMAIL_EXISTS);
    }
    
    // 哈希密码
    const hashedPassword = await hashPassword(data.password);
    
    // 创建用户
    const newUser = await createUser({
      email: data.email,
      password: hashedPassword,
      name: data.name
    });
    
    // 返回用户信息
    return toUserBasic(newUser);
  } catch (error) {
    // 记录错误并重新抛出
    logAuthError(error, 'register-user');
    throw error;
  }
}

/**
 * 检查邮箱是否存在
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    // 验证邮箱格式
    emailSchema.parse(email);
    
    // 查找用户
    const user = await findUserByEmail(email);
    return !!user;
  } catch (error) {
    // 如果是验证错误，说明邮箱格式无效
    logAuthError(error, 'check-email');
    
    // 对于验证错误，我们返回false，而不是抛出异常
    if (error instanceof Error && error.name === 'ZodError') {
      return false;
    }
    
    throw error;
  }
}

// 导出其他必要函数
export { getUserBasicById }; 