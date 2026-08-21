import { LuCrown, LuThumbsUp, LuMinus, LuFrown, LuThumbsDown } from 'react-icons/lu';

export const REACTION_KEY_MAP = {
    genius: 'R1',
    great: 'R2',
    normal: 'R0',
    boring: 'R11',
    bad: 'R12',
};

export const REACTIONS_ICONS = [
    { id: REACTION_KEY_MAP.genius, label: 'Thiên tài', icon: LuCrown, color: '#0400fa' },
    { id: REACTION_KEY_MAP.great, label: 'Hay', icon: LuThumbsUp, color: '#04ff08' },
    { id: REACTION_KEY_MAP.normal, label: 'Bình thường', icon: LuMinus, color: '#bdbdbd' },
    { id: REACTION_KEY_MAP.boring, label: 'Nhàm chán', icon: LuFrown, color: '#f77348' },
    { id: REACTION_KEY_MAP.bad, label: 'Tệ hại', icon: LuThumbsDown, color: '#ff0000' },
];