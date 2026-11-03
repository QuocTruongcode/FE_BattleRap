import { useState } from 'react';
import { LuTrophy } from 'react-icons/lu';
import { REACTION_KEY_MAP, REACTIONS_ICONS } from '../../constants/const';
import './RankingCard.css';

const geniusReaction = REACTIONS_ICONS.find(({ id }) => id === REACTION_KEY_MAP.genius);
const greatReaction = REACTIONS_ICONS.find(({ id }) => id === REACTION_KEY_MAP.great);

const getScoredBars = (barsScored) => {
    if (!Array.isArray(barsScored)) return [];

    return barsScored
        .map((bar, index) => ({
            ...bar,
            score: Number(bar.bayesianAverange),
            key: bar.id ?? index,
        }))
        .filter((bar) => Number.isFinite(bar.score))
        .sort((a, b) => b.score - a.score);
};

export default function RankingCard({
    battlerName = 'Battler',
    image,
    imageAlt,
    rank,
    barsScored = [],
    className = '',
}) {
    const [showDetails, setShowDetails] = useState(false);
    const scoredBars = getScoredBars(barsScored);
    const geniusCount = scoredBars.filter((bar) => bar.score > 9).length;
    const goodCount = scoredBars.length - geniusCount;
    const totalScore = scoredBars.reduce((total, bar) => total + bar.score, 0);
    const GeniusIcon = geniusReaction.icon;
    const GreatIcon = greatReaction.icon;

    return (
        <article className={`ranking-card-entry ${className}`.trim()}>
            <div className="ranking-card">
                {image ? (
                    <img
                        className="ranking-card__image"
                        src={image}
                        alt={imageAlt || battlerName}
                    />
                ) : (
                    <div className="ranking-card__image-placeholder" aria-hidden="true">
                        Chưa có hình ảnh
                    </div>
                )}

                <div className="ranking-card__content">
                    <p className="ranking-card__name">{battlerName}</p>
                    {rank != null && (
                        <div className={`ranking-card__rank${rank === 1 ? ' ranking-card__rank--first' : ''}`}>
                            <span>Top {rank}</span>
                            {rank === 1 && <LuTrophy aria-label="Hạng nhất" />}
                        </div>
                    )}
                    <div className="ranking-card__stats" aria-label={`Thống kê ${battlerName}`}>
                        <div className="ranking-card__score">
                            <span className="ranking-card__value">{totalScore.toFixed(1)}</span>
                            <span className="ranking-card__label">Tổng điểm</span>
                        </div>
                        <div className="ranking-card__stat" aria-label={`${geniusCount} câu thiên tài`}>
                            <span className="ranking-card__rating">
                                <GeniusIcon aria-hidden="true" style={{ color: geniusReaction.color }} />
                                <span>× {geniusCount}</span>
                            </span>
                            <span className="ranking-card__label">Thiên tài</span>
                        </div>
                        <div className="ranking-card__stat" aria-label={`${goodCount} câu hay`}>
                            <span className="ranking-card__rating">
                                <GreatIcon aria-hidden="true" style={{ color: greatReaction.color }} />
                                <span>× {goodCount}</span>
                            </span>
                            <span className="ranking-card__label">Câu hay</span>
                        </div>
                    </div>
                </div>
            </div>

            <button
                type="button"
                className="ranking-card__details-toggle"
                aria-expanded={showDetails}
                onClick={() => setShowDetails((isVisible) => !isVisible)}
            >
                {showDetails ? 'Ẩn chi tiết' : 'Xem chi tiết'}
            </button>

            {showDetails && (
                <ul className="ranking-card__details" aria-label={`Điểm các bar của ${battlerName}`}>
                    {scoredBars.length ? scoredBars.map((bar) => {
                        const reaction = bar.score > 9 ? geniusReaction : greatReaction;
                        const RatingIcon = reaction.icon;
                        return (
                            <li key={bar.key}>
                                <RatingIcon aria-hidden="true" style={{ color: reaction.color }} />
                                <span>{bar.score.toFixed(2)}</span>
                            </li>
                        );
                    }) : (
                        <li className="ranking-card__details-empty">Chưa có bar được chấm điểm.</li>
                    )}
                </ul>
            )}
        </article>
    );
}
