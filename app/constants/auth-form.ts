/**
 * 认证表单配置常量
 * 
 * 提供认证表单的默认配置和常量
 */
import { LoginCredentials, RegisterData } from '@/app/types';

/**
 * 登录表单默认值
 */
export const LOGIN_FORM_DEFAULTS: {
  initialValues: LoginCredentials;
  redirectUrl: string;
} = {
  initialValues: { 
    email: '', 
    password: '' 
  },
  redirectUrl: '/file'
};

/**
 * 注册表单默认值
 */
export const REGISTER_FORM_DEFAULTS: {
  initialValues: RegisterData;
  redirectUrl: string;
} = {
  initialValues: { 
    name: '', 
    email: '', 
    password: '', 
    confirmPassword: '' 
  },
  redirectUrl: '/'
};

/**
 * 表单统一配置
 */
export const AUTH_FORM_CONFIG = {
  login: LOGIN_FORM_DEFAULTS,
  register: REGISTER_FORM_DEFAULTS
}; 