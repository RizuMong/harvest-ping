import { create } from "zustand";

interface User {
  id: string;
  nrp: string;
  name: string;
  role: string;
  role_id: number;
  blok?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;

  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),

  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
    }),
}));