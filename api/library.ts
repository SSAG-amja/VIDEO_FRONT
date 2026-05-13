import client from './client';

// 2026.05.13 박현식
// 백엔드 poster_path를 앱에서 표시 가능한 이미지 URL로 변환한다.
const posterUrl = (posterPath?: string | null) => {
  if (!posterPath) {
    return 'https://via.placeholder.com/500x750?text=No+Image';
  }
  return posterPath.startsWith('http')
    ? posterPath
    : `https://image.tmdb.org/t/p/w500${posterPath}`;
};

// 2026.05.13 박현식
// 보관함 계열 API 응답 영화를 공통 카드 데이터로 변환한다.
const toStoredMovie = (movie: any) => ({
  id: Number(movie.movie_id ?? movie.id),
  title: movie.movie_title ?? movie.title ?? '',
  image: posterUrl(movie.poster_path ?? movie.posterPath),
});

// 2026.05.13 박현식
// Pin 보관함 API 응답을 프론트 store에서 쓰는 영화 카드 형태로 변환한다.
export const fetchPinnedMoviesApi = async (limit = 100) => {
  const response = await client.get('/api/v1/pinned', { params: { limit } });
  return (response.data.data ?? []).map(toStoredMovie);
};

// 2026.05.13 박현식
// 홈 피드 Pin 액션을 interaction API로 저장한다.
export const pinMovieApi = async (movieId: number) => {
  const response = await client.patch(`/api/v1/interactions/${movieId}`, { action_type: 'pin' });
  return response.data;
};

// 2026.05.13 박현식
// Pin 보관함에서 영화 하나를 삭제한다.
export const deletePinnedMovieApi = async (movieId: number) => {
  const response = await client.delete('/api/v1/pinned', { params: { movie_id: movieId } });
  return response.data;
};

// 2026.05.13 박현식
// Pin 보관함의 모든 영화를 삭제한다.
export const clearPinnedMoviesApi = async () => {
  const response = await client.delete('/api/v1/pinned/all');
  return response.data;
};

// 2026.05.13 박현식
// 관심없음 API 응답을 숨긴 영화 화면에서 쓰는 local 카드 형태로 변환한다.
export const fetchPassedMoviesApi = async (limit = 100) => {
  const response = await client.get('/api/v1/passed', { params: { limit } });
  return (response.data.data ?? []).map((movie: any) => ({
    ...toStoredMovie(movie),
    passedAt: new Date().toISOString(),
  }));
};

// 2026.05.13 박현식
// 홈 피드 Pass 액션을 interaction API로 저장한다.
export const passMovieApi = async (movieId: number) => {
  const response = await client.patch(`/api/v1/interactions/${movieId}`, { action_type: 'passed' });
  return response.data;
};

// 2026.05.13 박현식
// 관심없음 목록에서 영화 하나를 삭제한다.
export const deletePassedMovieApi = async (movieId: number) => {
  const response = await client.delete('/api/v1/passed', { params: { movie_id: movieId } });
  return response.data;
};

// 2026.05.13 박현식
// 관심없음 목록의 모든 영화를 삭제한다.
export const clearPassedMoviesApi = async () => {
  const response = await client.delete('/api/v1/passed/all');
  return response.data;
};

// 2026.05.13 박현식
// 시청 완료 영화 목록을 백엔드에서 조회한다.
export const fetchWatchedMoviesApi = async (limit = 100) => {
  const response = await client.get('/api/v1/watched', { params: { limit } });
  return (response.data.data ?? []).map(toStoredMovie);
};

// 2026.05.13 박현식
// OTT 바로 시청하기 클릭을 watched interaction으로 저장한다.
export const watchMovieApi = async (movieId: number) => {
  const response = await client.patch(`/api/v1/interactions/${movieId}`, { action_type: 'watched' });
  return response.data;
};

// 2026.05.13 박현식
// 시청 완료 목록에서 영화 하나를 삭제한다.
export const deleteWatchedMovieApi = async (movieId: number) => {
  const response = await client.delete('/api/v1/watched', { params: { movie_id: movieId } });
  return response.data;
};

// 2026.05.13 박현식
// 시청 완료 목록의 모든 영화를 삭제한다.
export const clearWatchedMoviesApi = async () => {
  const response = await client.delete('/api/v1/watched/all');
  return response.data;
};

// 2026.05.13 박현식
// 특정 플레이리스트 저장 액션을 saved interaction으로 백엔드에 전달한다.
export const saveMovieToPlaylistInteractionApi = async (movieId: number, playlistId: number) => {
  const response = await client.patch(`/api/v1/interactions/${movieId}`, {
    action_type: 'saved',
    playlist_id: playlistId,
  });
  return response.data;
};
