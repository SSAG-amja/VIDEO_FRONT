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
    const response = await client.get(`/api/v1/explore/movies/${movieId}`);
    const data = response.data;
    const rawStreamingProviders = (data.providers ?? data.otts ?? []).filter(
      (provider: any) => !provider.type || provider.type === 'streaming'
    );
    const hasStandardNetflix = rawStreamingProviders.some((provider: any) => {
      const id = Number(provider.provider_id ?? provider.ott_id);
      const name = String(provider.provider_name ?? provider.ott_name ?? '').trim().toLowerCase();
      return id === 8 || name === 'netflix';
    });
    const streamingProviders = rawStreamingProviders.filter((provider: any) => {
      if (!hasStandardNetflix) return true;
      const id = Number(provider.provider_id ?? provider.ott_id);
      const name = String(provider.provider_name ?? provider.ott_name ?? '').trim().toLowerCase();
      return id !== 1796 && !name.includes('standard with ads');
    });

    return {
      ...data,
      providers: streamingProviders,
    };
  } catch (error) {
    console.error("영화 상세 정보 호출 에러:", error);
    return null;
  }
};
