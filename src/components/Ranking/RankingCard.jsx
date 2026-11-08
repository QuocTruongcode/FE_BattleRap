import { useState } from 'react';
import { LuTrophy } from 'react-icons/lu';
import { FaMedal } from 'react-icons/fa6';
import { REACTION_KEY_MAP, REACTIONS_ICONS } from '../../constants/const';
import RankingCardDetails from './RankingCardDetails';
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
    videos = [],
    className = '',
    variant = 'default',
    isSelected = false,
    onSelect,
}) {
    const [showDetails, setShowDetails] = useState(false);
    const scoredBars = getScoredBars(barsScored);
    const geniusCount = scoredBars.filter((bar) => bar.score > 9).length;
    const goodCount = scoredBars.length - geniusCount;
    const totalScore = scoredBars.reduce((total, bar) => total + bar.score, 0);
    const GeniusIcon = geniusReaction.icon;
    const GreatIcon = greatReaction.icon;

    if (variant === 'compact') {
        return (
            <article className={`ranking-card-entry ranking-card-entry--compact ${className}`.trim()}>
                <button
                    type="button"
                    className="ranking-card-compact"
                    onClick={onSelect}
                    aria-expanded={isSelected}
                    aria-label={`${battlerName}, hạng ${rank}. ${isSelected ? 'Ẩn' : 'Xem'} thống kê`}
                >
                    <div className="ranking-card-compact__avatar">
                        {image ? (
                            <img src={image} alt={imageAlt || battlerName} />
                        ) : (
                            <span aria-hidden="true">{battlerName.slice(0, 1)}</span>
                        )}
                    </div>

                    <div className="ranking-card-compact__stats" aria-label={`Thống kê ${battlerName}`}>
                        <div className="ranking-card-compact__stat" aria-label={`${geniusCount} câu thiên tài`}>
                            <GeniusIcon aria-hidden="true" style={{ color: geniusReaction.color }} />
                            <span>{geniusCount}</span>
                        </div>
                        <div className="ranking-card-compact__score" aria-label={`Tổng điểm ${totalScore.toFixed(1)}`}>
                            {totalScore.toFixed(1)}
                        </div>
                        <div className="ranking-card-compact__stat" aria-label={`${goodCount} câu tốt`}>
                            <GreatIcon aria-hidden="true" style={{ color: greatReaction.color }} />
                            <span>{goodCount}</span>
                        </div>
                    </div>

                    <p className="ranking-card-compact__name" title={battlerName}>{battlerName}</p>
                </button>
                {rank != null && (
                    <p className={`ranking-card-compact__rank${rank <= 3 ? ` ranking-card-compact__rank--medal ranking-card-compact__rank--${rank}` : ''}`}>
                        {rank <= 3 ? (
                            <>
                                <FaMedal aria-hidden="true" />
                                <span className="ranking-card-compact__rank-label">TOP {rank}</span>
                            </>
                        ) : `TOP ${rank}`}
                    </p>
                )}
            </article>
        );
    }

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
                <RankingCardDetails battlerName={battlerName} barsScored={barsScored} videos={videos} />
            )}
        </article>
    );
}
