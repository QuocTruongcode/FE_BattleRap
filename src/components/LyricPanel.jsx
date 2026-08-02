import { useEffect, useRef } from 'react';
import styles from './LyricPanel.module.css';

export default function LyricPanel({ lyrics, currentTime, selectedId, onSelectLine }) {
    const activeRef = useRef(null);

    const getActiveLine = () => {
        for (let i = lyrics.length - 1; i >= 0; i--) {
            if (currentTime >= lyrics[i].time) return lyrics[i].id;
        }
        return null;
    };

    const activeId = getActiveLine();

    useEffect(() => {
        activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [activeId]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className={styles.lyricSection}>
            <div className={styles.lyricHeader}>Lyric</div>
            <div className={styles.lyricList}>
                {lyrics.map((line) => (
                    <div
                        key={line.id}
                        ref={line.id === activeId ? activeRef : null}
                        className={[
                            styles.lyricLine,
                            line.id === activeId ? styles.active : '',
                            line.id === selectedId ? styles.selected : '',
                            line.explanation ? styles.hasNote : '',
                        ].join(' ')}
                        onClick={() => onSelectLine(line)}
                    >
                        <span className={styles.lyricTime}>{formatTime(line.time)}</span>
                        <span className={styles.lyricContent}>{line.content}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}