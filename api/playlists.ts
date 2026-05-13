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
// 플레이리스트 썸네일 영화 응답을 앱 카드 데이터로 변환한다.
const toPlaylistMovie = (movie: any) => ({
  id: String(movie.movie_id ?? movie.id),
  title: movie.movie_title ?? movie.title ?? '',
  image: posterUrl(movie.poster_path ?? movie.posterPath),
  addedAt: movie.created_at ?? new Date().toISOString(),
});

// 2026.05.13 박현식
// 플레이리스트 API 응답을 프론트 store 구조로 변환한다.
const toPlaylist = (playlist: any) => ({
  id: String(playlist.playlist_id ?? playlist.id),
  name: playlist.playlist_title ?? playlist.name ?? '',
  isPublic: Boolean(playlist.playlist_is_public ?? playlist.isPublic),
  movieCount: Number(playlist.movie_count ?? playlist.movieCount ?? playlist.movies?.length ?? 0),
  movies: (playlist.movies ?? []).map(toPlaylistMovie),
});

// 2026.05.13 박현식
// 현재 사용자의 플레이리스트 목록을 조회한다.
export const fetchPlaylistsApi = async () => {
  const response = await client.get('/api/v1/playlist');
  return (response.data.data ?? []).map(toPlaylist);
};

// 2026.05.13 박현식
// 새 플레이리스트를 생성한다.
export const createPlaylistApi = async (name: string, isPublic = false) => {
  const response = await client.post('/api/v1/playlist', {
    playlist_title: name,
    playlist_is_public: isPublic,
  });
  return toPlaylist(response.data.data);
};

// 2026.05.13 박현식
// 플레이리스트 제목 또는 공개 여부를 수정한다.
export const updatePlaylistApi = async (
  playlistId: string | number,
  updates: { name?: string; isPublic?: boolean }
) => {
  const response = await client.patch('/api/v1/playlist', {
    playlist_id: Number(playlistId),
    playlist_title: updates.name,
    playlist_is_public: updates.isPublic,
  });
  return toPlaylist(response.data.data);
};

// 2026.05.13 박현식
// 플레이리스트 하나를 삭제한다.
export const deletePlaylistApi = async (playlistId: string | number) => {
  const response = await client.delete('/api/v1/playlist', {
    params: { playlist_id: Number(playlistId) },
  });
  return response.data;
};

// 2026.05.13 박현식
// 현재 사용자의 모든 플레이리스트를 삭제한다.
export const clearPlaylistsApi = async () => {
  const response = await client.delete('/api/v1/playlist/all');
  return response.data;
};
