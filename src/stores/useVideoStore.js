import { create } from 'zustand';

const useVideoStore = create((set) => ({
    // Chỉ lưu UI state, không fetch API ở đây nữa
    currentVideo: null,
    currentTime: 0,

    setCurrentVideo: (video) => set({ currentVideo: video }),
    setCurrentTime: (time) => set({ currentTime: time }),
}));

export { useVideoStore };