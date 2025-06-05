import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  isLoggedIn: boolean;
  userId: string | null;
  userName: string | null;
  login: () => void;
  logout: () => void;
  setUserId: (id: string | null) => void;
  setUserName: (name: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      userId: null,
      userName: null,
      login: () => set({ isLoggedIn: true }),
      logout: () => set({ isLoggedIn: false, userId: null, userName: null }),
      setUserId: (id) => set({ userId: id }),
      setUserName: (name) => set({ userName: name }),
    }),
    {
      name: 'chemiguard-auth', // the key in localStorage
    }
  )
);