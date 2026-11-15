import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

const SUBSCRIBED_ONLY_STORAGE_KEY = 'recommendation_subscribed_only';

interface RecommendationState {
  isSubscribedOnly: boolean;
  isHydrated: boolean;
  hydrate: () => Promise<boolean>;
  setSubscribedOnly: (value: boolean) => Promise<void>;
}

let hydratePromise: Promise<boolean> | null = null;

/**
 * 홈 피드 추천 모드(구독 중인 OTT만 추천받기) 전역 상태를 관리한다.
 * 기본값은 true이며, SecureStore에 저장된 설정이 있으면 복원한다.
 */
export const useRecommendationStore = create<RecommendationState>((set, get) => ({
  isSubscribedOnly: true,
  isHydrated: false,

  hydrate: async () => {
    if (get().isHydrated) {
      return get().isSubscribedOnly;
    }

    if (!hydratePromise) {
      hydratePromise = (async () => {
        let nextValue = true;
        try {
          const saved = await SecureStore.getItemAsync(SUBSCRIBED_ONLY_STORAGE_KEY);
          if (saved === 'false') {
            nextValue = false;
          } else if (saved === 'true') {
            nextValue = true;
          }
        } catch (error) {
          console.warn('Recommendation setting load failed:', error);
        }

        set({ isSubscribedOnly: nextValue, isHydrated: true });
        return nextValue;
      })().finally(() => {
        hydratePromise = null;
      });
    }

    return hydratePromise;
  },

  setSubscribedOnly: async (value: boolean) => {
    set({ isSubscribedOnly: value, isHydrated: true });
    try {
      await SecureStore.setItemAsync(SUBSCRIBED_ONLY_STORAGE_KEY, String(value));
    } catch (error) {
      console.warn('Recommendation setting save failed:', error);
    }
  },
}));
