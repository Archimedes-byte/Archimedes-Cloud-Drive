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