import { useQuery } from '@tanstack/react-query';
import { battlerService } from '../../services/api';

const getBattlers = (response) => {
    const battlers = response?.data ?? response;
    if (!Array.isArray(battlers)) {
        throw new Error('Dữ liệu battler trả về không hợp lệ.');
    }

    return battlers;
};

export const getScoredBars = (bars) => (
    (Array.isArray(bars) ? bars : []).filter((bar) => (
        bar?.bayesianAverange != null
        && bar.bayesianAverange !== ''
        && Number.isFinite(Number(bar.bayesianAverange))
    ))
);

const getTotalScore = (battler) => getScoredBars(battler.Bars)
    .reduce((total, bar) => total + Number(bar.bayesianAverange), 0);

export default function useRankingData() {
    const query = useQuery({
        queryKey: ['battlers'],
        queryFn: async () => getBattlers(await battlerService.getAll()),
        staleTime: 5 * 60 * 1000,
    });
    const battlers = query.data ?? [];
    const rankedBattlers = [...battlers].sort(
        (a, b) => getTotalScore(b) - getTotalScore(a)
    );
    const topBattlers = rankedBattlers.map((battler, index) => ({
        id: battler.id,
        rank: index + 1,
        battlerName: battler.RapName || battler.FullName,
        image: battler.image,
        imageAlt: battler.RapName || battler.FullName || 'Battler',
        barsScored: getScoredBars(battler.Bars),
        videos: Array.isArray(battler.Videos) ? battler.Videos : [],
    }));

    return {
        ...query,
        battlers,
        rankedBattlers,
        topBattlers,
    };
}
