/**
 * 认证系统常量配置
 * 
 * 集中管理所有认证相关常量，确保系统一致性
 */

/**
 * 认证常量配置
 */
export const AUTH_CONSTANTS = {
  // 路由配置
  ROUTES: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    ERROR: '/auth/error',
    DEFAULT_SUCCESS: '/file',
    PROFILE: '/account/profile',
  },
  
  // 认证提供商
  PROVIDERS: {
    CREDENTIALS: 'credentials',
    GOOGLE: 'google',
  },
  
  // 密码规则配置
  PASSWORD: {
    MIN_LENGTH: 8,
    RECOMMENDED_LENGTH: 12,
    REQUIRE_NUMBERS: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_UPPERCASE: true,
    REQUIRE_SPECIAL: true,
  },
  
  // 会话配置
  SESSION: {
    MAX_AGE: 30 * 24 * 60 * 60, // 30天 (秒)
  },
  
  // 本地存储键
  STORAGE_KEYS: {
    AUTH_TOKEN: 'auth_token',
    USER_INFO: 'user_info',
    REDIRECT_PATH: 'auth_redirect',
  },
  
  // API端点
  ENDPOINTS: {
    REGISTER: '/api/auth/register',
    CHECK_EMAIL: '/api/auth/check-email',
  },

  // 事件名称
  EVENTS: {
    LOGIN_MODAL: 'login_modal_toggle'
  }
};

/**
 * 认证错误码枚举
 */
export enum AUTH_ERROR_CODE {
  INVALID_CREDENTIALS = 'invalid_credentials',
  ACCOUNT_NOT_FOUND = 'account_not_found',
  EMAIL_EXISTS = 'email_exists',
  PASSWORD_MISMATCH = 'password_mismatch',
  SESSION_EXPIRED = 'session_expired',
  UNAUTHORIZED = 'unauthorized',
  VALIDATION_ERROR = 'validation_error',
  SERVER_ERROR = 'server_error',
}

/**
 * 认证操作类型枚举
 */
export enum AUTH_ACTION {
  LOGIN = 'login',
  REGISTER = 'register',
  LOGOUT = 'logout',
  RESET_PASSWORD = 'reset_password',
  VERIFY_EMAIL = 'verify_email',
} 