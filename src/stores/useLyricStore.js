// stores/useLyricStore.js
import { create } from 'zustand';

export const useLyricStore = create((set) => ({
    activeLineId: null,
    setActiveLineId: (id) => set({ activeLineId: id }),
}));