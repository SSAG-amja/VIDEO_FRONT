import { create } from 'zustand';

interface PlaylistState {
  playlists: string[];
  addPlaylist: (name: string) => void;
}

export const usePlaylistStore = create<PlaylistState>((set) => ({
  // 1. 초기 상태: Pinned와 Watched는 DB 연동 전/후 모두 지워지지 않는 기본 탭으로 고정
  playlists: ['Pinned', 'Watched'], 
  
  // 2. 새 재생목록 추가 (중복 방지 로직 포함)
  addPlaylist: (name) => set((state) => {
    if (state.playlists.includes(name)) return state;
    return { playlists: [...state.playlists, name] };
  }),
}));