import { useEffect, useRef, useState, useCallback } from 'react';
import styles from './LyricPanel.module.css';
import { REACTIONS_ICONS } from "../../constants/const.js";

export default function LyricPanel({ lyrics, getCurrentTime, selectedId, onSelectLine, usePlainCss = false, onActiveLineChange, selectedReactionID, activeLineId, selectedReactionsByLine = {} }) {
    const activeRef = useRef(null);
    const currentTimeRef = useRef(0);
    const [activeId, setActiveId] = useState(null);

    const computeActiveLine = useCallback((time) => {
        for (let i = lyrics.length - 1; i >= 0; i--) {
            if (time >= lyrics[i].time) return lyrics[i].id;
        }
        return null;
    }, [lyrics]);

    useEffect(() => {
        const interval = setInterval(() => {
            const time = getCurrentTime();
            currentTimeRef.current = time;

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
            active: styles.active,
            selected: styles.selected,
            hasNote: styles.hasNote,
        };

    const selectedReaction = REACTIONS_ICONS.find((reaction) => reaction.id === selectedReactionID);

    return (
        <div className={classes.lyricSection}>
            <div className={classes.lyricHeader}>Lyric</div>
            <div className={classes.lyricList}>
                {lyrics.map((line) => {
                    const lineReactionId = selectedReactionsByLine[line.id] ?? (line.id === activeLineId ? selectedReactionID : null);
                    const lineReaction = REACTIONS_ICONS.find((reaction) => reaction.id === lineReactionId);
                    const isActiveLine = line.id === activeId;
                    const isSelectedLine = line.id === selectedId;
                    const ReactionIcon = lineReaction?.icon;

                    return (
                        <div
                            style={{ border: `3px solid ${lineReaction?.color || 'transparent'}` }}
                            key={line.id}
                            ref={line.id === activeId ? activeRef : null}
                            className={[
                                classes.lyricLine,
                                isActiveLine ? classes.active : '',
                                isSelectedLine ? classes.selected : '',
                                line.explanation ? classes.hasNote : '',
                            ].join(' ')}
                            onClick={() => onSelectLine(line)}
                        >
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
                        </div>
                    );
                })}
            </div>
        </div>
    );
}