import { create } from 'zustand';

// 💡 저장할 영화 객체의 타입 정의
export interface PinnedMovie {
  id: number;
  title: string;
  image: string;
}

interface PinState {
  pinnedMovies: PinnedMovie[]; // 이제 숫자 배열이 아닌 객체 배열을 저장합니다.
  togglePin: (movie: PinnedMovie) => void;
}

export const usePinStore = create<PinState>((set) => ({
  pinnedMovies: [],
  togglePin: (movie) => set((state) => {
    // 💡 ID로 중복 여부를 검사합니다.
    const isPinned = state.pinnedMovies.some(m => m.id === movie.id);
    if (isPinned) {
      return { pinnedMovies: state.pinnedMovies.filter(m => m.id !== movie.id) };
    } else {
      return { pinnedMovies: [...state.pinnedMovies, movie] };
    }
  }),
}));