import client from './client';

// 1. 로그인 (Signin)
export const signinApi = async (email: string, password: string) => {
  const formData = new FormData();
  formData.append('username', email);
  formData.append('password', password);

  const response = await client.post('/api/v1/auth/signin', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// 2. 이메일 인증 코드 발송
export const sendEmailCodeApi = async (email: string) => {
  const response = await client.post('/api/v1/auth/email/send-code', {
    email,
  });
  return response.data;
};

// 3. 이메일 인증 코드 확인
export const verifyEmailCodeApi = async (email: string, code: string) => {
  const response = await client.post('/api/v1/auth/email/verify-code', {
    email,
    code,
  });
  return response.data;
};

// 4. 회원가입 (Signup)
export const signupApi = async (
  email: string,
  password: string,
  password_confirm: string,
  nickname: string,
  birth_date: string,
  gender: string,
  signup_token: string
) => {
  const response = await client.post('/api/v1/auth/signup', {
    email,
    password,
    password_confirm,
    nickname,
    birth_date,
    gender,
    signup_token,
  });
  return response.data;
};

// 2026.05.13 박현식
// 서버 로그아웃 API를 호출해 현재 인증 세션 종료를 요청한다.
export const signoutApi = async () => {
  const response = await client.post('/api/v1/auth/signout');
  return response.data;
};

// 2026.05.13 박현식
// 개인정보/비밀번호 변경 화면 진입 전 현재 비밀번호를 서버에서 검증한다.
export const verifyPasswordApi = async (currentPassword: string) => {
  const response = await client.post('/api/v1/auth/verify-password', {
    current_password: currentPassword,
  });
  return response.data;
};