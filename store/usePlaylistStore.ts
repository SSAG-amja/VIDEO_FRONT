// store/usePlaylistStore.ts
import { create } from 'zustand';

interface MovieItem {
  id: string; // id 타입을 string으로 통일 (API나 기존 하드코딩 데이터에 맞춤)
  title: string;
  image: string;
  addedAt?: string; // 추가된 시간 등 필요한 정보
}

interface Playlist {
  id: string;
  name: string;
  movies: MovieItem[];
}

interface PlaylistState {
  // 사용자가 생성한 플레이리스트 목록 (Saved 탭에 표시됨)
  customPlaylists: Playlist[]; 
  
  // 플레이리스트 생성
  createPlaylist: (name: string) => void;
  // 특정 플레이리스트에 영화 추가
  addMovieToPlaylist: (playlistId: string, movie: MovieItem) => void;
  // 특정 플레이리스트 삭제
  deletePlaylist: (playlistId: string) => void;
}

export const usePlaylistStore = create<PlaylistState>((set) => ({
  customPlaylists: [], 
  
  createPlaylist: (name) => set((state) => {
    // 이름 중복 검사
    if (state.customPlaylists.some(p => p.name === name)) return state;
    
    const newPlaylist: Playlist = {
      id: Date.now().toString(), // 고유 ID 생성
      name,
      movies: [],
    };
    return { customPlaylists: [...state.customPlaylists, newPlaylist] };
  }),

  addMovieToPlaylist: (playlistId, movie) => set((state) => {
    return {
      customPlaylists: state.customPlaylists.map(playlist => {
        if (playlist.id === playlistId) {
          // 이미 추가된 영화인지 확인
          if (playlist.movies.some(m => m.id === movie.id)) return playlist;
          return { ...playlist, movies: [...playlist.movies, movie] };
        }
        return playlist;
      })
    };
  }),

  deletePlaylist: (playlistId) => set((state) => ({
    customPlaylists: state.customPlaylists.filter(p => p.id !== playlistId)
  })),
}));