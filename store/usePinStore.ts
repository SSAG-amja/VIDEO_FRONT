import { create } from 'zustand';

export interface PinnedMovie {
  id: number;
  title: string;
  image: string;
}

interface PinState {
  pinnedMovies: PinnedMovie[];
  pinMovie: (movie: PinnedMovie) => void;
  unpinMovie: (id: number) => void;
  togglePin: (movie: PinnedMovie) => void;
  setPinnedMovies: (movies: PinnedMovie[]) => void;
  clearPinnedMovies: () => void;
  // ✅ Pin 목록 순서 변경 함수 추가
  updatePinOrder: (newMovies: PinnedMovie[]) => void;
}

export const usePinStore = create<PinState>((set) => ({
  pinnedMovies: [],
  // 2026.05.13 박현식
  // Pin 영화 하나를 중복 없이 전역 상태에 추가한다.
  pinMovie: (movie) => set((state) => {
    if (state.pinnedMovies.some(m => m.id === movie.id)) return state;
    return { pinnedMovies: [...state.pinnedMovies, movie] };
  }),
  // 2026.05.13 박현식
  // Pin 전역 상태에서 영화 하나를 제거한다.
  unpinMovie: (id) => set((state) => ({
    pinnedMovies: state.pinnedMovies.filter(m => m.id !== id)
  })),
  togglePin: (movie) => set((state) => {
    const isPinned = state.pinnedMovies.some(m => m.id === movie.id);
    if (isPinned) {
      return { pinnedMovies: state.pinnedMovies.filter(m => m.id !== movie.id) };
    } else {
      return { pinnedMovies: [...state.pinnedMovies, movie] };
    }
  }),
  // 2026.05.13 박현식
  // 백엔드에서 조회한 Pin 목록으로 전역 상태를 동기화한다.
  setPinnedMovies: (movies) => set({ pinnedMovies: movies }),
  // 2026.05.13 박현식
  // Pin 전역 상태를 빈 목록으로 초기화한다.
  clearPinnedMovies: () => set({ pinnedMovies: [] }),
  // ✅ 드래그 앤 드롭 후 새로운 배열로 덮어씌웁니다.
  updatePinOrder: (newMovies) => set({ pinnedMovies: newMovies }),
}));
