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
  isPublic: boolean;
}

interface PlaylistState {
  customPlaylists: Playlist[]; 
  
  // 플레이리스트 관리
  createPlaylist: (name: string, isPublic?: boolean) => void;
  deletePlaylist: (playlistId: string) => void;
  togglePlaylistVisibility: (playlistId: string) => void;
  
  // 영화 관리
  addMovieToPlaylist: (playlistId: string, movie: MovieItem) => void;
  removeMovieFromPlaylist: (playlistId: string, movieId: string) => void; 
  
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
      isPublic,
    };
    return { customPlaylists: [...state.customPlaylists, newPlaylist] };
  }),

  // 2. 플레이리스트에 영화 추가
  addMovieToPlaylist: (playlistId, movie) => set((state) => {
    return {
      customPlaylists: state.customPlaylists.map(playlist => {
        if (playlist.id === playlistId) {
          if (playlist.movies.some(m => m.id === movie.id)) return playlist;
          return { ...playlist, movies: [...playlist.movies, movie] };
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
          movies: playlist.movies.filter(movie => movie.id !== movieId)
        };
      }
      return playlist;
    })
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