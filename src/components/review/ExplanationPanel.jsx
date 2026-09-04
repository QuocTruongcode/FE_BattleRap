export default function ExplanationPanel({ line, onClose }) {
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className={`explanation-panel ${!line ? 'hidden' : ''}`}>
            {line && (
                <>
                    <div className="panel-header">
                        <h3>Giải thích punchline</h3>
                        <span className="panel-timestamp">{formatTime(line.timestamp)}</span>
                        <button className="panel-close" onClick={onClose}>×</button>
                    </div>
                    <div className="panel-body">
                        <div className="quote-box">{line.text}</div>

                        {line.explanation ? (
                            <>
                                <div className="panel-section">
                                    <div className="panel-section-label">Nghĩa</div>
                                    <p>{line.explanation.meaning}</p>
                                </div>

                                <div className="panel-section">
                                    <div className="panel-section-label">Reference</div>
                                    <p>{line.explanation.reference}</p>
                                    {line.explanation.refTag && (
                                        <span className="ref-tag">{line.explanation.refTag}</span>
                                    )}
                                </div>

                                <div className="why-box">
                                    <div className="panel-section-label">Tại sao hay</div>
                                    <p>{line.explanation.whyGood}</p>
                                </div>
                            </>
                        ) : (
                            <div className="panel-section">
                                <p style={{ color: '#aaa' }}>Chưa có giải thích cho câu này.</p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}