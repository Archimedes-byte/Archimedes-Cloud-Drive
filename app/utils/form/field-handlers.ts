import React from 'react';

/**
 * 创建表单字段变更处理函数
 * 
 * @param field 字段名称
 * @param handleInputChange 处理输入变更的函数
 * @returns 表单变更事件处理函数
 */
export function createFieldChangeHandler(
  field: string,
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, fieldName: string) => void
) {
  return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    handleInputChange(e, field);
  };
}

/**
 * 创建表单字段失去焦点处理函数
 * 
 * @param field 字段名称
 * @param validateField 验证字段的函数
 * @returns 表单失焦事件处理函数
 */
export function createFieldBlurHandler(
  field: string,
  validateField: (field: string, value: string) => void
) {
  return (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    validateField(field, e.target.value);
  };
}

/**
 * 处理输入元素获取焦点时自动选中全部文本
 * 
 * @param e 焦点事件
 */
export function handleFocusWithSelect(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.target.select();
} 