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
  // ✅ isPublic 매개변수 추가 (기본값은 false)
  createPlaylist: (name: string, isPublic?: boolean) => void;
  addMovieToPlaylist: (playlistId: string, movie: MovieItem) => void;
  deletePlaylist: (playlistId: string) => void;
  togglePlaylistVisibility: (playlistId: string) => void;
  removeMovieFromPlaylist: (playlistId: string, movieId: string) => void; 
}

export const usePlaylistStore = create<PlaylistState>((set) => ({
  customPlaylists: [], 
  
  // ✅ 두 번째 인자로 isPublic을 받아 적용합니다.
  createPlaylist: (name, isPublic = false) => set((state) => {
    if (state.customPlaylists.some(p => p.name === name)) return state;
    
    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      name,
      movies: [],
      isPublic, // 선택한 공개/비공개 상태 적용
    };
    return { customPlaylists: [...state.customPlaylists, newPlaylist] };
  }),

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

  deletePlaylist: (playlistId) => set((state) => ({
    customPlaylists: state.customPlaylists.filter(p => p.id !== playlistId)
  })),

  togglePlaylistVisibility: (playlistId) => set((state) => ({
    customPlaylists: state.customPlaylists.map(playlist => 
      playlist.id === playlistId 
        ? { ...playlist, isPublic: !playlist.isPublic }
        : playlist
    )
  })),

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
}));