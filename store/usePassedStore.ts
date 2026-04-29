import { create } from 'zustand';

interface PassedMovie {
  id: number;
  title: string;
  image: string;
  passedAt: string; // 나중에 DB에 넘길 때 정렬이나 시간 기록용으로 유용합니다.
}

interface PassedStoreState {
  passedMovies: PassedMovie[];
  passMovie: (movie: Omit<PassedMovie, 'passedAt'>) => void;
  unpassMovie: (id: number) => void;
}

export const usePassedStore = create<PassedStoreState>((set) => ({
  passedMovies: [],
  
  // X를 누르거나 스와이프하여 넘겼을 때 캐시에 추가
  passMovie: (movie) => set((state) => {
    // 이미 넘긴 목록에 있으면 중복 추가 방지
    if (state.passedMovies.some(m => m.id === movie.id)) return state;
    return {
      passedMovies: [{ ...movie, passedAt: new Date().toISOString() }, ...state.passedMovies]
    };
  }),

  // 숨긴 영화 목록에서 "복구" 버튼을 눌렀을 때 캐시에서 제거
  unpassMovie: (id) => set((state) => ({
    passedMovies: state.passedMovies.filter(m => m.id !== id)
  }))
}));