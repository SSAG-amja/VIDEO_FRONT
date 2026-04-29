// 260330 박현식
// 탐색 페이지 관련 API 요청 로직 (VIDEO_BACK 연동)

import client from './client';

/**
 * # 260330 박현식
 * # 1. TMDB 통합 검색 (Multi Search)
 * # 영화 제목, 배우, 감독 등을 검색하여 가공된 영화/출연작 리스트를 받아옵니다.
 * 백엔드 경로: /api/v1/explore/search
 */
// 💡 정렬 기준(sort)에 'rating' 추가
export const fetchSearchData = async (query: string, sort: 'latest' | 'likes' | 'rating' = 'latest') => {
  try {
    const response = await client.get('/api/v1/explore/search', {
      params: { 
        q: query,
        sort: sort // 백엔드로 정렬 기준 전달
      },
    });
    
    return response.data.movies || [];
  } catch (error) {
    console.error("Search API 호출 에러:", error);
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