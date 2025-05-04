/**
 * 表单工具函数
 * 
 * 提供表单操作相关的通用工具函数
 */
import { FormState } from './types';

/**
 * 获取字段错误信息
 * 
 * 当字段被触碰并且有错误时返回错误信息
 * 
 * @param formState 表单状态
 * @param field 字段名
 * @returns 错误消息或undefined
 */
export function getFieldError<T extends Record<string, any>>(
  formState: FormState<T>,
  field: keyof T
): string | undefined {
  return formState.touched[field] && formState.errors[field] 
    ? formState.errors[field] 
    : undefined;
}

/**
 * 检查表单字段是否有效
 * 
 * @param formState 表单状态
 * @param field 字段名
 * @returns 字段是否有效
 */
export function isFieldValid<T extends Record<string, any>>(
  formState: FormState<T>,
  field: keyof T
): boolean {
  return !(field in formState.errors);
}

/**
 * 检查表单是否已修改
 * 
 * @param formState 表单状态
 * @param initialValues 初始值
 * @returns 表单是否已修改
 */
export function isFormDirty<T extends Record<string, any>>(
  formState: FormState<T>,
  initialValues: T
): boolean {
  return Object.keys(formState.values).some(key => {
    const field = key as keyof T;
    return formState.values[field] !== initialValues[field];
  });
}

/**
 * 检查所有必填字段是否已填写
 * 
 * @param formState 表单状态
 * @param requiredFields 必填字段列表
 * @returns 是否所有必填字段都已填写
 */
export function areRequiredFieldsFilled<T extends Record<string, any>>(
  formState: FormState<T>,
  requiredFields: Array<keyof T>
): boolean {
  return requiredFields.every(field => {
    const value = formState.values[field];
    return value !== undefined && value !== null && value !== '';
  });
}

/**
 * 获取表单提交状态文本
 * 
 * @param isSubmitting 是否正在提交
 * @param defaultText 默认文本
 * @param submittingText 提交中文本
 * @returns 状态文本
 */
export function getSubmitButtonText(
  isSubmitting: boolean,
  defaultText: string,
  submittingText: string
): string {
  return isSubmitting ? submittingText : defaultText;
} 