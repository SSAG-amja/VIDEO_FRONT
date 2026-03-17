// 260315 박현식
// 로그인 및 회원가입 관련 API 요청 로직 (VIDEO_BACK 연동)

import client from './client';

/**
 * # 260315 박현식
 * # 1. 로그인 (Login)
 * # OAuth2 규격에 따라 FormData를 활용하여 백엔드 토큰을 요청합니다.
 * 백엔드 경로: /api/v1/login/
 * 주의: 백엔드 login.router가 "/"로 설정되어 있으므로 끝에 /를 포함해야 합니다.
 */
export const loginApi = async (email: string, password: string) => {
  const formData = new FormData();
  formData.append('username', email); // 백엔드 보안 로직상 email이 username 역할을 함
  formData.append('password', password);

  const response = await client.post('/api/v1/login/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data; // { access_token: "...", token_type: "bearer" }
};

/**
 * # 260315 박현식
 * # 2. 회원가입 (Sign-in)
 * # 유저의 기본 정보(이메일, 비밀번호, 닉네임)를 JSON 바디에 담아 서버에 생성 요청을 보냅니다.
 * 백엔드 경로: /api/v1/users/signin
 */
export const signinApi = async (email: string, password: string, nickname: string) => {
  const response = await client.post('/api/v1/users/signin', {
    email,
    password,
    nickname,
  });
  return response.data;
};