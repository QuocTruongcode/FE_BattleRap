import { useEffect, useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import {
    REACTION_KEY_MAP,
    REACTIONS_ICONS,
} from '../../constants/const.js';
import { battlerService } from '../../services/api.js';
import './TableSummary.css';

const EMPTY_BARS = [];
const SUMMARY_REACTIONS = [
    { id: REACTION_KEY_MAP.genius, label: 'Thiên tài', range: '> 9' },
    { id: REACTION_KEY_MAP.great, label: 'Tốt', range: '> 7 đến 9' },
    { id: REACTION_KEY_MAP.boring, label: 'Nhàm chán', range: '> 2 đến 4' },
    { id: REACTION_KEY_MAP.bad, label: 'Tệ hại', range: '< 2' },
];
const TOP_BAR_COUNT = 5;

function getBattlerFromResponse(response) {
    const data = response?.data ?? response;
    return data?.battler ?? data?.Battler ?? data;
}

function getReactionForScore(score) {
    if (score > 9) return REACTIONS_ICONS.find((reaction) => reaction.id === REACTION_KEY_MAP.genius);
    if (score > 7) return REACTIONS_ICONS.find((reaction) => reaction.id === REACTION_KEY_MAP.great);
    if (score > 2 && score <= 4) return REACTIONS_ICONS.find((reaction) => reaction.id === REACTION_KEY_MAP.boring);
    if (score > 0 && score <= 2) return REACTIONS_ICONS.find((reaction) => reaction.id === REACTION_KEY_MAP.bad);
    return REACTIONS_ICONS.find((reaction) => reaction.id === REACTION_KEY_MAP.normal);
}

function formatBarTime(time) {
    const totalSeconds = Math.max(0, Math.floor(Number(time)));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
}

export default function TableSummary({
    savedBars = EMPTY_BARS,
    currentTimeRef,
    onBarSelect,
}) {
    const [visibleBars, setVisibleBars] = useState([]);

    useEffect(() => {
        let animationFrameId;
        let previousVisibleBars = [];

        const updateVisibleBars = () => {
            const currentTime = currentTimeRef
                ? Number(currentTimeRef.current)
                : Number.POSITIVE_INFINITY;
            const nextVisibleBars = savedBars.filter((bar) => {
                const barTime = Number(bar.time);
                return Number.isFinite(barTime)
                    && Number.isFinite(currentTime)
                    && barTime <= currentTime;
            });
            const hasChanged = nextVisibleBars.length !== previousVisibleBars.length
                || nextVisibleBars.some((bar, index) => bar !== previousVisibleBars[index]);

            if (hasChanged) {
                previousVisibleBars = nextVisibleBars;
                setVisibleBars(nextVisibleBars);
            }

            animationFrameId = requestAnimationFrame(updateVisibleBars);
        };

        updateVisibleBars();
        return () => cancelAnimationFrame(animationFrameId);
    }, [savedBars, currentTimeRef]);

    const battlers = useMemo(() => {
        const groupedBars = new Map();

        visibleBars.forEach((bar) => {
            const battlerId = bar.barttelID ?? bar.battlerId;
            if (battlerId == null || battlerId === '') return;

            const key = String(battlerId);
            if (!groupedBars.has(key)) {
                groupedBars.set(key, { id: battlerId, bars: [] });
            }
            groupedBars.get(key).bars.push(bar);
        });

        return [...groupedBars.values()];
    }, [visibleBars]);

    const battlerQueries = useQueries({
        queries: battlers.map(({ id }) => ({
            queryKey: ['battler', id],
            queryFn: () => battlerService.getById(id),
            enabled: id != null && id !== '',
            staleTime: 5 * 60 * 1000,
        })),
    });

    const topBars = useMemo(
        () => visibleBars
            .map((bar) => ({ ...bar, score: Number(bar.bayesianAverange) }))
            .filter((bar) => Number.isFinite(bar.score) && Number.isFinite(Number(bar.time)))
            .sort((first, second) => second.score - first.score)
            .slice(0, TOP_BAR_COUNT),
        [visibleBars],
    );

    return (
        <section className="table-summary-wrap" aria-label="Tổng hợp điểm battler">
            {battlers.length > 0 ? (
                <div className="table-summary">
                    {battlers.map(({ id, bars }, index) => {
                    const query = battlerQueries[index];
                    const battler = query.data ? getBattlerFromResponse(query.data) : null;
                    const rapName = battler?.RapName ?? battler?.rapName ?? 'Battler';
                    const fullName = battler?.FullName ?? battler?.fullName ?? '';
                    const counts = bars.reduce(
                        (result, bar) => {
                            const score = Number(bar.bayesianAverange);
                            if (!Number.isFinite(score)) return result;

                            if (score > 9) result[REACTION_KEY_MAP.genius] += 1;
                            else if (score > 7) result[REACTION_KEY_MAP.great] += 1;
                            else if (score > 2 && score <= 4) result[REACTION_KEY_MAP.boring] += 1;
                            else if (score > 0 && score <= 2) result[REACTION_KEY_MAP.bad] += 1;

                            return result;
                        },
                        {
                            [REACTION_KEY_MAP.genius]: 0,
                            [REACTION_KEY_MAP.great]: 0,
                            [REACTION_KEY_MAP.boring]: 0,
                            [REACTION_KEY_MAP.bad]: 0,
                        },
                    );

                    return (
                        <article
                            className="table-summary__player"
                            key={id}
                            style={{ '--player-accent': index === 0 ? '#596cff' : '#ff4545' }}
                        >
                            <header className="table-summary__header">
                                {query.isPending ? (
                                    <span className="table-summary__subtitle">Đang tải battler...</span>
                                ) : query.isError ? (
                                    <span className="table-summary__error">Không tải được battler</span>
                                ) : (
                                    <>
                                        <strong className="table-summary__name">{rapName}</strong>
                                        {fullName && (
                                            <span className="table-summary__subtitle">{fullName}</span>
                                        )}
                                    </>
                                )}
                            </header>

                            <ul className="table-summary__reactions">
                                {SUMMARY_REACTIONS.map((summaryReaction) => {
                                    const reaction = REACTIONS_ICONS.find(
                                        (item) => item.id === summaryReaction.id,
                                    );
                                    const Icon = reaction?.icon;

                                    return (
                                        <li className="table-summary__reaction" key={summaryReaction.id}>
                                            {Icon && (
                                                <Icon
                                                    className="table-summary__icon"
                                                    aria-hidden="true"
                                                    style={{ color: reaction.color }}
                                                />
                                            )}
                                            <span className="table-summary__label">
                                                {summaryReaction.label}
                                                <small>{summaryReaction.range}</small>
                                            </span>
                                            <span className="table-summary__count">{counts[summaryReaction.id]}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </article>
                    );
                    })}
                </div>
            ) : (
                <div className="table-summary table-summary--empty">
                    Chưa có bar được gán cho battler.
                </div>
            )}
            {topBars.length > 0 && (
                <div className="table-summary__top-bars" aria-label="Các bar được đánh giá cao nhất">
                    {topBars.map((bar) => {
                        const reaction = getReactionForScore(bar.score);
                        const Icon = reaction?.icon;

                        return (
                            <button
                                className="table-summary__top-bar"
                                key={bar.id ?? `${bar.time}-${bar.score}`}
                                type="button"
                                value={bar.time}
                                title={`${reaction?.label ?? 'Bar'} - ${bar.score.toFixed(1)} điểm`}
                                onClick={() => onBarSelect?.(Number(bar.time))}
                            >
                                {Icon && (
                                    <Icon
                                        className="table-summary__top-bar-icon"
                                        aria-hidden="true"
                                        style={{ color: reaction.color }}
                                    />
                                )}
                                <span>{formatBarTime(bar.time)}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
