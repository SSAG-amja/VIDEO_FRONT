// store/usePlaylistStore.ts
import { create } from 'zustand';

interface MovieItem {
  id: string;
  title: string;
  image: string;
  addedAt?: string;
}

interface Playlist {
  id: string;
  name: string;
  movies: MovieItem[];
  movieCount?: number;
  isPublic: boolean;
}

interface PlaylistState {
  customPlaylists: Playlist[]; 
  
  // 플레이리스트 관리
  createPlaylist: (name: string, isPublic?: boolean) => void;
  addPlaylist: (playlist: Playlist) => void;
  setPlaylists: (playlists: Playlist[]) => void;
  updatePlaylist: (playlistId: string, updates: Partial<Pick<Playlist, 'name' | 'isPublic' | 'movieCount'>>) => void;
  clearPlaylists: () => void;
  deletePlaylist: (playlistId: string) => void;
  togglePlaylistVisibility: (playlistId: string) => void;
  
  // 영화 관리
  addMovieToPlaylist: (playlistId: string, movie: MovieItem) => void;
  removeMovieFromPlaylist: (playlistId: string, movieId: string) => void; 
  setPlaylistMovies: (playlistId: string, movies: MovieItem[]) => void;
  clearPlaylistMovies: (playlistId: string) => void;
  
  // 🔄 드래그 앤 드롭 순서 변경 함수들
  updatePlaylistOrder: (playlistId: string, newMovies: MovieItem[]) => void;
  updateCustomPlaylistsOrder: (newPlaylists: Playlist[]) => void;
}

export const usePlaylistStore = create<PlaylistState>((set) => ({
  customPlaylists: [], 
  
  // 1. 새 플레이리스트 생성
  createPlaylist: (name, isPublic = false) => set((state) => {
    if (state.customPlaylists.some(p => p.name === name)) return state;
    
    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      name,
      movies: [],
      movieCount: 0,
      isPublic,
    };
    return { customPlaylists: [...state.customPlaylists, newPlaylist] };
  }),

  // 2026.05.13 박현식
  // 새 플레이리스트를 중복 없이 전역 상태에 추가한다.
  addPlaylist: (playlist) => set((state) => {
    if (state.customPlaylists.some(p => p.id === playlist.id)) return state;
    return { customPlaylists: [...state.customPlaylists, playlist] };
  }),

  // 2026.05.13 박현식
  // 백엔드에서 조회한 플레이리스트 목록으로 전역 상태를 동기화한다.
  setPlaylists: (playlists) => set({ customPlaylists: playlists }),

  // 2026.05.13 박현식
  // 플레이리스트 제목 또는 공개 여부를 전역 상태에 반영한다.
  updatePlaylist: (playlistId, updates) => set((state) => ({
    customPlaylists: state.customPlaylists.map(playlist =>
      playlist.id === playlistId ? { ...playlist, ...updates } : playlist
    )
  })),

  // 2026.05.13 박현식
  // 모든 플레이리스트 전역 상태를 초기화한다.
  clearPlaylists: () => set({ customPlaylists: [] }),

  // 2. 플레이리스트에 영화 추가
  addMovieToPlaylist: (playlistId, movie) => set((state) => {
    return {
      customPlaylists: state.customPlaylists.map(playlist => {
        if (playlist.id === playlistId) {
          if (playlist.movies.some(m => m.id === movie.id)) return playlist;
          return { ...playlist, movies: [...playlist.movies, movie], movieCount: (playlist.movieCount ?? playlist.movies.length) + 1 };
        }
        return playlist;
      })
    };
  }),

  // 3. 플레이리스트 자체 삭제
  deletePlaylist: (playlistId) => set((state) => ({
    customPlaylists: state.customPlaylists.filter(p => p.id !== playlistId)
  })),

  // 4. 플레이리스트 공개/비공개 토글
  togglePlaylistVisibility: (playlistId) => set((state) => ({
    customPlaylists: state.customPlaylists.map(playlist => 
      playlist.id === playlistId 
        ? { ...playlist, isPublic: !playlist.isPublic }
        : playlist
    )
  })),

  // 5. 플레이리스트 안에서 특정 영화 삭제
  removeMovieFromPlaylist: (playlistId, movieId) => set((state) => ({
    customPlaylists: state.customPlaylists.map(playlist => {
      if (playlist.id === playlistId) {
        return {
          ...playlist,
          movies: playlist.movies.filter(movie => movie.id !== movieId),
          movieCount: Math.max((playlist.movieCount ?? playlist.movies.length) - 1, 0)
        };
      }
      return playlist;
    })
  })),

  // 2026.05.13 박현식
  // 백엔드에서 조회한 특정 플레이리스트 영화 목록으로 상태를 동기화한다.
  setPlaylistMovies: (playlistId, movies) => set((state) => ({
    customPlaylists: state.customPlaylists.map(playlist =>
      playlist.id === playlistId ? { ...playlist, movies, movieCount: movies.length } : playlist
    )
  })),

  // 2026.05.13 박현식
  // 특정 플레이리스트의 영화 목록 상태를 빈 목록으로 초기화한다.
  clearPlaylistMovies: (playlistId) => set((state) => ({
    customPlaylists: state.customPlaylists.map(playlist =>
      playlist.id === playlistId ? { ...playlist, movies: [], movieCount: 0 } : playlist
    )
  })),

  // 🔄 6. 특정 플레이리스트 안의 영화 목록 순서 덮어쓰기 (상세 화면용)
  updatePlaylistOrder: (playlistId, newMovies) => set((state) => ({
    customPlaylists: state.customPlaylists.map(playlist => 
      playlist.id === playlistId 
        ? { ...playlist, movies: newMovies } 
        : playlist
    )
  })),

  // 🔄 7. 플레이리스트 폴더 전체의 순서 덮어쓰기 (보관함 화면용)
  updateCustomPlaylistsOrder: (newPlaylists) => set({
    customPlaylists: newPlaylists
  }),
}));
