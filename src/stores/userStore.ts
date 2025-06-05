import { create } from 'zustand';

type UserInfo = {
  id: string;
  email: string;
  name: string;
  organization: string;
};

interface UserStore {
  userInfo: UserInfo | null;
  setUserInfo: (info: UserInfo) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  userInfo: null,
  setUserInfo: (info) => set({ userInfo: info }),
}));