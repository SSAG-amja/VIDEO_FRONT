import { create } from 'zustand';

export interface PinnedMovie {
  id: number;
  title: string;
  image: string;
}

interface PinState {
  pinnedMovies: PinnedMovie[];
  togglePin: (movie: PinnedMovie) => void;
  // ✅ Pin 목록 순서 변경 함수 추가
  updatePinOrder: (newMovies: PinnedMovie[]) => void;
}

export const usePinStore = create<PinState>((set) => ({
  pinnedMovies: [],
  togglePin: (movie) => set((state) => {
    const isPinned = state.pinnedMovies.some(m => m.id === movie.id);
    if (isPinned) {
      return { pinnedMovies: state.pinnedMovies.filter(m => m.id !== movie.id) };
    } else {
      return { pinnedMovies: [...state.pinnedMovies, movie] };
    }
  }),
  // ✅ 드래그 앤 드롭 후 새로운 배열로 덮어씌웁니다.
  updatePinOrder: (newMovies) => set({ pinnedMovies: newMovies }),
}));