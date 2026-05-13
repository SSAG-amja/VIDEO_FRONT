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
// 플레이리스트 영화 API 응답을 앱 카드 데이터로 변환한다.
const toPlaylistMovie = (movie: any) => ({
  id: String(movie.movie_id ?? movie.id),
  title: movie.movie_title ?? movie.title ?? '',
  image: posterUrl(movie.poster_path ?? movie.posterPath),
  addedAt: movie.created_at ?? new Date().toISOString(),
});

// 2026.05.13 박현식
// 특정 플레이리스트에 담긴 영화 목록을 조회한다.
export const fetchPlaylistMoviesApi = async (playlistId: string | number) => {
  const response = await client.get(`/api/v1/playlist/${playlistId}/movies`);
  return (response.data.data ?? []).map(toPlaylistMovie);
};

// 2026.05.13 박현식
// 특정 플레이리스트에 영화 하나를 추가한다.
export const addPlaylistMovieApi = async (playlistId: string | number, movieId: string | number) => {
  const response = await client.post(`/api/v1/playlist/${playlistId}/movies`, {
    movie_id: Number(movieId),
  });
  return response.data;
};

// 2026.05.13 박현식
// 특정 플레이리스트에서 영화 하나를 삭제한다.
export const deletePlaylistMovieApi = async (playlistId: string | number, movieId: string | number) => {
  const response = await client.delete(`/api/v1/playlist/${playlistId}/movies`, {
    params: { movie_id: Number(movieId) },
  });
  return response.data;
};

// 2026.05.13 박현식
// 특정 플레이리스트의 모든 영화를 삭제한다.
export const clearPlaylistMoviesApi = async (playlistId: string | number) => {
  const response = await client.delete(`/api/v1/playlist/${playlistId}/movies/all`);
  return response.data;
};
