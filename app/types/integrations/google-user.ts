/**
 * Google用户类型定义
 * 
 * 包含Google API返回的用户信息结构
 */

export interface GoogleUser {
  id: string;
  email: string;
  familyName: string;
  givenName: string;
  name: string;
  picture: string;
  verifiedEmail: boolean;
}

// 导出默认接口
export default GoogleUser; 