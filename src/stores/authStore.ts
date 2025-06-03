import { create } from 'zustand';

interface AuthState {
  isLoggedIn: boolean;
  login: (id: string, pw: string) => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  login: (id: string, pw: string) => {
    const success = id === 'admin' && pw === '1234';
    if (success) set({ isLoggedIn: true });
    return success;
  },
  logout: () => set({ isLoggedIn: false }),
}));