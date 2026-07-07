import { useEffect, useRef } from 'react';

export default function LyricPanel({ lyrics, currentTime, selectedId, onSelectLine }) {
    const activeRef = useRef(null);


    const getActiveLine = () => {
        for (let i = lyrics.length - 1; i >= 0; i--) {
            if (currentTime >= lyrics[i].time) return lyrics[i].id;
        }
        return null;
    };

    const activeId = getActiveLine();

    // Auto-scroll đến dòng đang phát
    useEffect(() => {
        activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [activeId]);


    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        console.log(':', currentTime),
        <div className="lyric-section">
            <div className="lyric-header">Lyric</div>
            <div className="lyric-list">
                {lyrics.map((line) => (
                    <div
                        key={line.id}
                        ref={line.id === activeId ? activeRef : null}
                        className={[
                            'lyric-line',
                            line.id === activeId ? 'active' : '',
                            line.id === selectedId ? 'selected' : '',
                            line.explanation ? 'has-note' : '',
                        ].join(' ')}
                        onClick={() => onSelectLine(line)}
                    >
                        <span className="lyric-time">{formatTime(line.time)}</span>
                        <span className="lyric-content">{line.content}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}