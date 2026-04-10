// 260330 박현식
// 탐색 페이지 관련 API 요청 로직 (VIDEO_BACK 연동)

import client from './client';

/**
 * # 260330 박현식
 * # 1. TMDB 통합 검색 (Multi Search)
 * # 영화 제목, 배우, 감독 등을 검색하여 가공된 영화/출연작 리스트를 받아옵니다.
 * 백엔드 경로: /api/v1/explore/search
 */
export const fetchSearchData = async (query: string) => {
  try {
    // axios의 params 속성을 사용하면 자동으로 ?q=검색어 형태로 변환해 줍니다.
    const response = await client.get('/api/v1/explore/search', {
      params: { q: query },
    });
    
    // 백엔드에서 {"movies": [...]} 형태로 응답하므로 movies 배열만 추출하여 리턴
    return response.data.movies || [];
  } catch (error) {
    console.error("Search API 호출 에러:", error);
    // 에러 발생 시 앱이 뻗지 않도록 빈 배열 반환
    return []; 
  }
};

/**
 * # 260330 박현식
 * # 2. 태그 기반 추천 영화 가져오기
 * 백엔드 경로: /api/v1/explore/recommend
 */

export const fetchRecommendData = async (tag: string, page: number = 1) => {
  try {
    const response = await client.get('/api/v1/explore/recommend', {
      params: { tag, page },
    });
    return response.data.movies || [];
  } catch (error) {
    console.error("Recommend API 호출 에러:", error);
    return []; 
  }
};