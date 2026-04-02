"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { Role } from "@/types/api";

type AuthState = {
  token: string;
  role: Role | "";
  email: string;
  userId: string;
  name: string;
  globalLoading: boolean;
  setGlobalLoading: (v: boolean) => void;
  setAuth: (p: { token: string; role: Role; email: string; userId: string; name: string }) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: "",
      role: "",
      email: "",
      userId: "",
      name: "",
      globalLoading: false,
      setGlobalLoading: (v) => set({ globalLoading: v }),
      setAuth: (p) =>
        set({
          token: p.token,
          role: p.role,
          email: p.email,
          userId: p.userId,
          name: p.name,
        }),
      clear: () =>
        set({
          token: "",
          role: "",
          email: "",
          userId: "",
          name: "",
        }),
    }),
    {
      name: "finance-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        token: s.token,
        role: s.role,
        email: s.email,
        userId: s.userId,
        name: s.name,
      }),
    }
  )
);
