import { create } from 'zustand';
import { getUser, getToken, clearAuth, setAuth } from '../utils/api';

const useAuthStore = create((set) => ({
  user: getUser(),
  token: getToken(),
  isAuthenticated: !!getToken(),

  setUser: (token, user) => {
    setAuth(token, user);
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    clearAuth();
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateUser: (user) => {
    const token = getToken();
    if (token) setAuth(token, user);
    set({ user });
  },
}));

export default useAuthStore;
