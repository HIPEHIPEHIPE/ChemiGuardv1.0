import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type UserInfo = {
  id: string;
  email: string;
  name: string;
  organization: string;
  role: 'admin' | 'user'; 
};

interface UserStore {
  userInfo: UserInfo | null;
  setUserInfo: (info: UserInfo) => void;
  // 로그아웃 등을 위한 상태 초기화 함수도 추가하면 좋습니다.
  clearUserInfo: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      userInfo: null,
      setUserInfo: (info) => set({ userInfo: info }),
      clearUserInfo: () => set({ userInfo: null }), // 초기화 함수 구현
    }),
    {
      name: 'chemiguard-user',
    }
  )
);