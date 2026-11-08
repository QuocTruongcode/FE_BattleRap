import RankingCard from './RankingCard';
import backgroundRank from '../../assets/BackgroudRank.jpg';
import './Ranking.css';
import useRankingData from './useRankingData';

export default function Ranking() {
    const {
        data: battlers = [],
        rankedBattlers,
        isLoading,
        error,
    } = useRankingData();

    if (isLoading) {
        return <p className="ranking-page__status" role="status">Đang tải danh sách battler...</p>;
    }

    if (error) {
        return <p className="ranking-page__error" role="alert">{error.message}</p>;
    }

    return (
        console.log("Check batlers: ", battlers),
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
                        barsScored={battler.Bars}
                        videos={battler.Videos}
                    />
                ))}
            </div>
            {battlers.length === 0 && (
                <p className="ranking-page__status">Chưa có battler nào.</p>
            )}
        </div>
    );
}
