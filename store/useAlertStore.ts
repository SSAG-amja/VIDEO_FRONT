import { create } from 'zustand';

export type AppAlertButton = {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

export type AppAlertOptions = {
  cancelable?: boolean;
  onDismiss?: () => void;
};

interface AlertItem {
  title: string;
  message?: string;
  buttons: AppAlertButton[];
  options?: AppAlertOptions;
}

interface AlertStoreState {
  current: AlertItem | null;
  queue: AlertItem[];
  show: (
    title: string,
    message?: string,
    buttons?: AppAlertButton[],
    options?: AppAlertOptions
  ) => void;
  dismiss: () => void;
}

export const useAlertStore = create<AlertStoreState>((set) => ({
  current: null,
  queue: [],
  show: (title, message, buttons, options) =>
    set((state) => {
      const normalizedButtons: AppAlertButton[] =
        buttons && buttons.length > 0 ? buttons : [{ text: '확인', style: 'default' }];
      const nextItem: AlertItem = {
        title,
        message,
        buttons: normalizedButtons,
        options,
      };
      if (!state.current) {
        return { current: nextItem };
      }
      return { queue: [...state.queue, nextItem] };
    }),
  dismiss: () =>
    set((state) => {
      if (state.queue.length > 0) {
        const [next, ...rest] = state.queue;
        return { current: next, queue: rest };
      }
      return { current: null, queue: [] };
    }),
}));

export const AppAlert = {
  alert: (
    title: string,
    message?: string,
    buttons?: AppAlertButton[],
    options?: AppAlertOptions
  ) => {
    useAlertStore.getState().show(title, message, buttons, options);
  },
};
