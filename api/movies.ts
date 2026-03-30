// 260330 박현식
// 영화 단건 상세 조회 관련 API 요청 로직

import client from './client';

/**
 * # 260330 박현식
 * # 1. 영화 상세 정보 보강 (Lazy Fetching)
 * # 영화 ID를 보내서 트레일러, 출연진, 전체 시놉시스 등을 가져옵니다.
 * 백엔드 경로: /api/v1/movie_load/{movie_id}
 */
export const fetchMovieDetailData = async (movieId: string | number) => {
  try {
    const response = await client.get(`/api/v1/movie_load/${movieId}`);
    return response.data;
  } catch (error) {
    console.error("영화 상세 정보 호출 에러:", error);
    return null;
  }
};