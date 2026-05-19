import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BachelorFilter } from "../services/api";

type FilterStore = {
  bachelorFilter: BachelorFilter;
  setBachelorFilter: (filter: Partial<BachelorFilter>) => void;
  replaceBachelorFilter: (filter: BachelorFilter) => void;
  clearBachelorFilter: () => void;
};

const defaultBachelorFilter: BachelorFilter = {
  year: 2025,
  sort: "baseRank_asc",
  limit: 20,
};

export const useFilterStore = create<FilterStore>()((set) => ({
  bachelorFilter: defaultBachelorFilter,
  setBachelorFilter: (newFilter) =>
    set((state) => ({ bachelorFilter: compactFilter({ ...state.bachelorFilter, ...newFilter }) })),
  replaceBachelorFilter: (filter) => set({ bachelorFilter: compactFilter(filter) }),
  clearBachelorFilter: () => set({ bachelorFilter: defaultBachelorFilter }),
}));

function compactFilter(filter: BachelorFilter) {
  return Object.fromEntries(
    Object.entries(filter).filter(([, value]) => value !== undefined && value !== "" && value !== null)
  ) as BachelorFilter;
}

type User = { id: string; email: string; name?: string };

type AuthStore = {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  updateUser: (user: User) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: (user, token) => {
        localStorage.setItem("token", token);
        set({ user, token });
      },
      updateUser: (user) => set({ user }),
      logout: () => {
        localStorage.removeItem("token");
        set({ user: null, token: null });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);

type PreferenceStore = {
  activeListId: string | null;
  setActiveList: (id: string | null) => void;
};

export const usePreferenceStore = create<PreferenceStore>()(
  persist(
    (set) => ({
      activeListId: null,
      setActiveList: (id) => set({ activeListId: id }),
    }),
    { name: "preference-storage" }
  )
);
