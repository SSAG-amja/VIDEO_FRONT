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

// 2026.05.13 박현식
// 개인정보 수정 화면에서 변경한 프로필 필드를 백엔드에 저장한다.
export const updateUserProfileApi = async (updateData: {
  nickname?: string;
  birth_date?: string;
  gender?: string;
}) => {
  const response = await client.patch('/api/v1/user/me', updateData);
  return response.data;
};

// 2026.05.13 박현식
// 현재 비밀번호 인증 후 새 비밀번호를 백엔드에 전달해 해시 갱신을 요청한다.
// 2026.06.05 임재준
// 현재 비밀번호 검증 단계에서 발급받은 password_change_token을 함께 전달해 비밀번호 변경 권한을 검증한다.
export const updateUserPasswordApi = async (passwordData: {
  password_change_token: string;
  new_password: string;
  new_password_confirm: string;
}) => {
  const response = await client.patch('/api/v1/user/me/new-password', passwordData);
  return response.data;
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