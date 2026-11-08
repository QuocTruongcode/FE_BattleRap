import { useNavigate } from 'react-router-dom';
import { REACTION_KEY_MAP, REACTIONS_ICONS } from '../../constants/const';

const geniusReaction = REACTIONS_ICONS.find(({ id }) => id === REACTION_KEY_MAP.genius);
const greatReaction = REACTIONS_ICONS.find(({ id }) => id === REACTION_KEY_MAP.great);

function getScoredBars(bars) {
    if (!Array.isArray(bars)) return [];

    return bars
        .map((bar, index) => ({
            ...bar,
            score: Number(bar.bayesianAverange),
            key: bar.id ?? index,
        }))
        .filter((bar) => Number.isFinite(bar.score))
        .sort((first, second) => second.score - first.score);
}

export default function RankingCardDetails({ battlerName, barsScored = [], videos = [] }) {
    const navigate = useNavigate();
    const scoredBars = getScoredBars(barsScored);
    const videosById = new Map(videos.map((video) => [String(video.id), video]));
    const matchHistory = scoredBars.reduce((matches, bar) => {
        if (bar.videoId == null) return matches;

        const videoId = String(bar.videoId);
        let match = matches.find((item) => item.videoId === videoId);
        if (!match) {
            match = { videoId, video: videosById.get(videoId), bars: [] };
            matches.push(match);
        }
        match.bars.push(bar);
        return matches;
    }, []);

    const openBar = (bar) => {
        const startTime = Number(bar.startTime);
        if (bar.videoId == null || bar.startTime == null || !Number.isFinite(startTime) || startTime < 0) return;

        navigate(`/watch/${bar.videoId}?t=${encodeURIComponent(startTime)}`);
    };

    return (
        <div className="ranking-card__details-layout">
            <section className="ranking-card__details-panel" aria-label={`Điểm các bar của ${battlerName}`}>
                <h3 className="ranking-card__details-heading">Thành tích</h3>
                <ul className="ranking-card__details">
                    {scoredBars.length ? scoredBars.map((bar) => {
                        const reaction = bar.score > 9 ? geniusReaction : greatReaction;
                        const RatingIcon = reaction.icon;
                        return (
                            <li key={bar.key}>
                                <button
                                    type="button"
                                    className="ranking-card__bar-link"
                                    onClick={() => openBar(bar)}
                                    disabled={bar.videoId == null || bar.startTime == null || !Number.isFinite(Number(bar.startTime))}
                                    aria-label={`Mở video tại ${bar.startTime} giây, điểm ${bar.score.toFixed(2)}`}
                                >
                                    <RatingIcon aria-hidden="true" style={{ color: reaction.color }} />
                                    <span>{bar.score.toFixed(2)}</span>
                                </button>
                            </li>
                        );
                    }) : (
                        <li className="ranking-card__details-empty">Chưa có bar được chấm điểm.</li>
                    )}
                </ul>
            </section>

            <section className="ranking-card__details-panel" aria-label={`Lịch sử đấu của ${battlerName}`}>
                <h3 className="ranking-card__details-heading">Lịch sử đấu</h3>
                <div className="ranking-card__match-history">
                    {matchHistory.length ? matchHistory.map(({ videoId, video, bars }) => (
                        <article className="ranking-card__match" key={videoId}>
                            {video?.thumbnailUrl ? (
                                <img
                                    className="ranking-card__match-thumbnail"
                                    src={video.thumbnailUrl}
                                    alt=""
                                    loading="lazy"
                                />
                            ) : (
                                <div className="ranking-card__match-thumbnail ranking-card__match-thumbnail--empty">
                                    Không có ảnh
                                </div>
                            )}
                            <div className="ranking-card__match-content">
                                <h4>{video?.title || `Trận đấu #${videoId}`}</h4>
                                <ul className="ranking-card__match-bars">
                                    {bars.map((bar) => {
                                        const reaction = bar.score > 9 ? geniusReaction : greatReaction;
                                        const RatingIcon = reaction.icon;
                                        return (
                                            <li key={bar.key}>
                                                <button
                                                    type="button"
                                                    className="ranking-card__bar-link"
                                                    onClick={() => openBar(bar)}
                                                    disabled={bar.videoId == null || bar.startTime == null || !Number.isFinite(Number(bar.startTime))}
                                                    aria-label={`Mở video tại ${bar.startTime} giây, điểm ${bar.score.toFixed(2)}`}
                                                >
                                                    <RatingIcon aria-hidden="true" style={{ color: reaction.color }} />
                                                    <span>{bar.score.toFixed(2)}</span>
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        </article>
                    )) : (
                        <p className="ranking-card__details-empty">Chưa có lịch sử đấu.</p>
                    )}
                </div>
            </section>
        </div>
    );
}
