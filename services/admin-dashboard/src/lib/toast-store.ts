type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

type Listener = (toasts: ToastMessage[]) => void;

class ToastStore {
  private toasts: ToastMessage[] = [];
  private listeners: Listener[] = [];

  subscribe(fn: Listener) {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(l => l !== fn); };
  }

  private notify() {
    this.listeners.forEach(fn => fn([...this.toasts]));
  }

  add(type: ToastType, title: string, message?: string, duration = 4000) {
    const id = Math.random().toString(36).slice(2);
    this.toasts = [...this.toasts, { id, type, title, message, duration }];
    this.notify();
    if (duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }
  }

  remove(id: string) {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.notify();
  }
}

export const toastStore = new ToastStore();

export const toast = {
  success: (title: string, message?: string) => toastStore.add('success', title, message),
  error:   (title: string, message?: string) => toastStore.add('error',   title, message, 6000),
  info:    (title: string, message?: string) => toastStore.add('info',    title, message),
  warning: (title: string, message?: string) => toastStore.add('warning', title, message, 5000),
};
