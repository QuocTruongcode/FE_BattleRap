import { LuCrown, LuThumbsUp, LuMinus, LuFrown, LuThumbsDown } from 'react-icons/lu';

export const getAverageScoreColor = (score) => {
    if (score == null || score === '') return undefined;

    const numericScore = Number(score);
    if (!Number.isFinite(numericScore)) return undefined;
    if (numericScore >= 0 && numericScore <= 2) return '#8B0000';
    if (numericScore <= 4 && numericScore > 2) return '#F97316';
    if (numericScore <= 7 && numericScore > 4) return '#E5E7EB';
    if (numericScore <= 9 && numericScore > 7) return '#00c548';
    return '#2b00ff';
};

export const getOptimisticReactionStats = (line, selectedReactionId, existingReactionId) => {
    if (selectedReactionId == null || selectedReactionId === existingReactionId) {
        return { averageScore: line.averageScore, totalReaction: line.totalReaction };
    }

    const selectedPoint = REACTION_POINT[selectedReactionId];
    if (!Number.isFinite(selectedPoint)) {
        return { averageScore: line.averageScore, totalReaction: line.totalReaction };
    }

    const parsedCount = Number(line.totalReaction);
    const currentCount = Number.isFinite(parsedCount) ? Math.max(0, parsedCount) : 0;
    const nextCount = currentCount + 1;
    const parsedAverage = Number(line.averageScore);
    const hasAverage = line.averageScore != null
        && line.averageScore !== ''
        && Number.isFinite(parsedAverage);

    if (hasAverage) {
        const currentTotalPoints = parsedAverage * currentCount;
        const nextTotalPoints = currentTotalPoints + selectedPoint;

        return {
            averageScore: nextCount > 0 ? nextTotalPoints / nextCount : selectedPoint,
            totalReaction: nextCount,
        };
    }

    return {
        averageScore: currentCount === 0 ? selectedPoint : line.averageScore,
        totalReaction: nextCount,
    };
};

export const REACTION_KEY_MAP = {
    genius: 'R2',
    great: 'R1',
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


export const REACTION_POINT = {
    R2: 10,
    R1: 8,
    R0: 5,
    R11: 2,
    R12: 0,
};