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

// 2. 회원가입 (Signup)
export const signupApi = async (email: string, password: string, password_check: string, nickname: string, birth_date: string, gender: string) => {
  const response = await client.post('/api/v1/auth/signup', {
    email, 
    password, 
    password_check, 
    nickname, 
    birth_date, 
    gender,
  });
  return response.data;
};

export const signoutApi = async () => {
  const response = await client.post('/api/v1/auth/signout');
  return response.data;
};