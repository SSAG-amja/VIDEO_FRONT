// store/usePinStore.ts
//pin상태 동기화 파일
//260331 임재준
import { create } from 'zustand';

interface PinState {
  pinnedMovies: number[]; // Pin된 영화의 id 목록
  togglePin: (id: number) => void;
}

export const usePinStore = create<PinState>((set) => ({
  pinnedMovies: [],
  togglePin: (id) => set((state) => {
    const isPinned = state.pinnedMovies.includes(id);
    if (isPinned) {
      // 이미 Pin 되어 있다면 제거
      return { pinnedMovies: state.pinnedMovies.filter(movieId => movieId !== id) };
    } else {
      // Pin 되어 있지 않다면 추가
      return { pinnedMovies: [...state.pinnedMovies, id] };
    }
  }),
}));