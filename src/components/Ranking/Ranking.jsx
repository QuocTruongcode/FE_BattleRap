import { useQuery } from '@tanstack/react-query';
import { battlerService } from '../../services/api';
import RankingCard from './RankingCard';
import backgroundRank from '../../assets/BackgroudRank.jpg';
import './Ranking.css';

const getBattlers = (response) => {
    const battlers = response?.data ?? response;
    if (!Array.isArray(battlers)) {
        throw new Error('Dữ liệu battler trả về không hợp lệ.');
    }

    return battlers;
};

const getScoredBars = (bars) => (
    (Array.isArray(bars) ? bars : []).filter((bar) => (
        bar?.bayesianAverange != null
        && bar.bayesianAverange !== ''
        && Number.isFinite(Number(bar.bayesianAverange))
    ))
);

const getTotalScore = (battler) => getScoredBars(battler.Bars)
    .reduce((total, bar) => total + Number(bar.bayesianAverange), 0);

export default function Ranking() {
    const {
        data: battlers = [],
        isLoading,
        error,
    } = useQuery({
        queryKey: ['battlers'],
        queryFn: async () => getBattlers(await battlerService.getAll()),
        staleTime: 5 * 60 * 1000,
    });

    if (isLoading) {
        return <p className="ranking-page__status" role="status">Đang tải danh sách battler...</p>;
    }

    if (error) {
        return <p className="ranking-page__error" role="alert">{error.message}</p>;
    }

    const rankedBattlers = [...battlers].sort(
        (a, b) => getTotalScore(b) - getTotalScore(a)
    );

    return (
        <div
            className="ranking-page"
            style={{ backgroundImage: `url("${backgroundRank}")` }}
        >
            <div className="ranking-page__grid">
                {rankedBattlers.map((battler, index) => (
                    <RankingCard
                        key={battler.id}
                        rank={index + 1}
                        battlerName={battler.RapName || battler.FullName}
                        image={battler.image}
                        imageAlt={battler.RapName || battler.FullName || 'Battler'}
                        barsScored={getScoredBars(battler.Bars)}
                    />
                ))}
            </div>
            {battlers.length === 0 && (
                <p className="ranking-page__status">Chưa có battler nào.</p>
            )}
        </div>
    );
}
