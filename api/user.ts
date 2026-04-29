import client from './client';

// ==========================================
// ✅ 백엔드 구현 완료된 API (실제 통신)
// ==========================================

// 1. 내 정보 조회
export const getUserProfileApi = async () => {
  const response = await client.get('/api/v1/user/me');
  return response.data;
};

// 2. 온보딩 데이터 저장
// (백엔드의 user_schema.UserOnboarding 형태에 맞춰서 파라미터를 조정하세요)
export const submitOnboardingApi = async (onboardingData: {
  otts: number[];
  genres: number[];
  movies: number[];
}) => {
  const response = await client.post('/api/v1/user/me/onboarding', onboardingData);
  return response.data;
};


// ==========================================
// ❌ 백엔드 미구현 API (화면 구성을 위한 임시 Mocking)
// ==========================================

// 3. 내 정보 수정 (백엔드 @router.patch("/me") 주석 해제 시 교체)
export const updateUserProfileApi = async (updateData: {
  nickname?: string;
  birth_date?: string;
  gender?: string;
}) => {
  // const response = await client.patch('/api/v1/user/me', updateData);
  // return response.data;

  console.log('🚀 [Mock API] 백엔드로 전송될 유저 업데이트 데이터:', updateData);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, message: '임시: 프로필 수정 성공' });
    }, 500);
  });
};

// 4. 내 OTT 구독 정보 조회 (백엔드 @router.get("/me/otts") 주석 해제 시 교체)
export const getUserOttsApi = async () => {
  // const response = await client.get('/api/v1/user/me/otts');
  // return response.data;

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, data: [1, 3] }); // 임시로 1(넷플릭스), 3(티빙) 리턴
    }, 500);
  });
};

// 5. 내 OTT 구독 정보 수정 (백엔드 @router.put("/me/otts") 주석 해제 시 교체)
export const updateUserOttsApi = async (selectedOtts: number[]) => {
  const response = await client.put('/api/v1/user/otts', { otts: selectedOtts });
  return response.data;

  console.log('🚀 [Mock API] 백엔드로 전송될 OTT 수정 데이터:', selectedOtts);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, message: '임시: OTT 정보 수정 성공' });
    }, 500);
  });
};