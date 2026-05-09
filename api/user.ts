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
  const [ottsResponse, genresResponse, moviesResponse] = await Promise.all([
    client.put('/api/v1/user/user/otts', { ott_ids: onboardingData.otts }),
    client.put('/api/v1/user/user/genres', { genre_ids: onboardingData.genres }),
    client.put('/api/v1/user/user/favorite-movies', { movie_ids: onboardingData.movies }),
  ]);

  return {
    otts: ottsResponse.data,
    genres: genresResponse.data,
    movies: moviesResponse.data,
  };
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
  const response = await getUserProfileApi();
  const ottIds = response.otts?.map((ott: any) => ott.tmdb_id ?? ott.id ?? ott.ott_id) ?? [];
  return { success: true, data: ottIds };
};

// 5. 내 OTT 구독 정보 수정 (백엔드 @router.put("/me/otts") 주석 해제 시 교체)
export const updateUserOttsApi = async (selectedOtts: number[]) => {
  const response = await client.put('/api/v1/user/user/otts', { ott_ids: selectedOtts });
  return response.data;
};
