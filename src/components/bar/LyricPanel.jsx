import { useEffect, useRef, useState, useCallback } from 'react';
import styles from './LyricPanel.module.css';
import {
    getAverageScoreColor,
    getOptimisticReactionStats,
    REACTIONS_ICONS,
} from "../../constants/const.js";
import { useLyricStore } from "../../stores/useLyricStore.js"
export default function LyricPanel({ lyrics, getCurrentTime, selectedId,
    onSelectLine, usePlainCss = false, onActiveLineChange,
    selectedReactionID, activeLineId, selectedReactionsByLine = {}, reactionBarByVideo = [] }) {
    const activeRef = useRef(null);
    const [activeId, setActiveId] = useState(null);

    const computeActiveLine = useCallback((time) => {
        for (let i = lyrics.length - 1; i >= 0; i--) {
            if (time >= lyrics[i].time) return lyrics[i];
        }
        return null;
    }, [lyrics]);

    const setActiveLineId = useLyricStore((s) => s.setActiveLineId);

    useEffect(() => {
        setActiveLineId(activeId);
    }, [activeId, setActiveLineId]);
    useEffect(() => {
        const interval = setInterval(() => {
            const time = getCurrentTime();

            const newActiveId = computeActiveLine(time);
            setActiveId(prev => (prev === newActiveId ? prev : newActiveId));
        }, 200);
        return () => clearInterval(interval);
    }, [getCurrentTime, computeActiveLine]);

    useEffect(() => {
        onActiveLineChange?.(activeId);
    }, [activeId, onActiveLineChange]);

    useEffect(() => {
        activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [activeId]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const classes = usePlainCss
        ? {
            lyricSection: 'lyricSection',
            lyricHeader: 'lyricHeader',
            lyricList: 'lyricList',
            lyricLine: 'lyricLine',
            lyricTime: 'lyricTime',
            lyricContent: 'lyricContent',
            lyricStats: 'lyricStats',
            active: 'active',
            selected: 'selected',
            hasNote: 'has-note',
        }
        : {
            lyricSection: styles.lyricSection,
            lyricHeader: styles.lyricHeader,
            lyricList: styles.lyricList,
            lyricLine: styles.lyricLine,
            lyricTime: styles.lyricTime,
            lyricContent: styles.lyricContent,
            lyricStats: styles.lyricStats,
            active: styles.active,
            selected: styles.selected,
            hasNote: styles.hasNote,
        };

    return (
        // console.log("Check activeId: ", activeId),
        <div className={classes.lyricSection}>
            <div className={classes.lyricHeader}>Lyric</div>
            <div className={classes.lyricList}>
                {lyrics.map((line) => {
                    const savedReaction = reactionBarByVideo.find(
                        (reaction) => String(reaction.barID) === String(line.id)
                    );
                    const optimisticReactionId = selectedReactionsByLine[line.id]
                        ?? (line.id === activeLineId ? selectedReactionID : null);
                    const lineReactionId = selectedReactionsByLine[line.id]
                        ?? savedReaction?.ReactionType
                        ?? (line.id === activeLineId ? selectedReactionID : null);
                    const reactionStats = getOptimisticReactionStats(
                        line,
                        optimisticReactionId,
                        savedReaction?.ReactionType,
                    );
                    const lineReaction = REACTIONS_ICONS.find((reaction) => reaction.id === lineReactionId);
                    const isActiveLine = line.id === activeId?.id;
                    const isSelectedLine = line.id === selectedId;
                    const ReactionIcon = lineReaction?.icon;

                    return (
                        <div
                            style={{
                                border: 'none',
                                borderLeft: `6px solid ${lineReaction?.color || 'transparent'}`,
                            }}
                            key={line.id}
                            ref={line.id === activeId?.id ? activeRef : null}
                            className={[
                                classes.lyricLine,
                                isActiveLine ? classes.active : '',
                                isSelectedLine ? classes.selected : '',
                                line.explanation ? classes.hasNote : '',
                            ].join(' ')}
                            onClick={() => onSelectLine(line)}
                        >
                            {isActiveLine && (
                                <span
                                    key={line.id}
                                    className={styles.progressBar}
                                    style={{
                                        backgroundColor: lineReaction?.color || 'transparent',
                                    }}
                                />
                            )}
                            <span className={classes.lyricTime}>{formatTime(line.time)}</span>
                            <span className={classes.lyricContent}>{line.content}</span>

                            {lineReaction && ReactionIcon && (
                                <span
                                    aria-label={lineReaction.label}
                                    title={lineReaction.label}
                                    style={{
                                        color: lineReaction.color,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        marginLeft: '8px',
                                        padding: '7px 7px',
                                        fontSize: '1.2rem',
                                        border: `3px solid ${lineReaction.color}`,
                                        borderRadius: '50%',
                                        // backgroundColor: 'rgba(135, 121, 121, 0.8)',
                                    }}
                                >
                                    <ReactionIcon />
                                </span>
                            )}
                            <span className={classes.lyricStats}>
                                <span style={{ color: getAverageScoreColor(reactionStats.averageScore) }}>
                                    {reactionStats.averageScore == null
                                        ? '-'
                                        : Number(reactionStats.averageScore).toFixed(1)} đ
                                </span>
                                /
                                <span>{reactionStats.totalReaction ?? '-'} Ratings</span>
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}