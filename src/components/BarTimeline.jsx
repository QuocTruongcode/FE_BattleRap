import { useState, useMemo } from 'react';
import './BarTimeline.css';
/**
 * BarTimeline
 * Props:
 *  - bars: [{ id, time, content }]         — local state từ EditBar
 *  - onEdit: (bar) => void                 — trả bar về BarInputPanel để sửa
 *  - onDelete: (id) => void                — xoá khỏi local state
 *  - onSaveDraft: () => void               — gọi API lưu tất cả bars
 *  - onExportLyric: () => void             — export lyric
 *  - isSaving: boolean
 *  - lastSavedAt: Date | null
 *  - videoTitle: string
 *  - videoId: string | number
 */
export default function BarTimeline({
    bars = [],
    onEdit,
    onDelete,
    onSaveDraft,
    onExportLyric,
    isSaving = false,
    lastSavedAt = null,
    videoTitle = '',
    videoId = '',
    currentTime = 0,
}) {
    const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    const formatTime = (secs) => {
        if (secs == null) return '--:--';
        const m = Math.floor(secs / 60);
        const s = (secs % 60).toFixed(2).padStart(5, '0');
        return `${m}:${s}`;
    };

    const formatSavedAt = (date) => {
        if (!date) return null;
        return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    const sortedBars = useMemo(() => {
        return [...bars].sort((a, b) =>
            sortOrder === 'asc' ? a.time - b.time : b.time - a.time
        );
    }, [bars, sortOrder]);

    // Bar nào đang active (gần nhất với currentTime)
    const activeId = useMemo(() => {
        if (!bars.length) return null;
        const passed = bars.filter(b => b.time <= currentTime);
        if (!passed.length) return null;
        return passed.reduce((prev, curr) => curr.time > prev.time ? curr : prev).id;
    }, [bars, currentTime]);

    const handleDeleteClick = (id) => {
        setConfirmDeleteId(id);
    };

    const handleConfirmDelete = () => {
        if (confirmDeleteId != null) {
            onDelete?.(confirmDeleteId);
            setConfirmDeleteId(null);
        }
    };

    return (
        <div className="bar-timeline">
            {/* Header */}
            <div className="bt-header">
                <div className="bt-header-left">
                    <span className="bt-title">Danh sách bar</span>
                    <span className="bt-count">({bars.length})</span>
                </div>
                <div className="bt-header-right">
                    <button
                        type="button"
                        className="bt-btn-sort"
                        onClick={() => setSortOrder(s => s === 'asc' ? 'desc' : 'asc')}
                        title="Sắp xếp theo thời gian"
                    >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
                            <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
                        </svg>
                        Sắp xếp theo thời gian {sortOrder === 'asc' ? '↑' : '↓'}
                    </button>
                    <button
                        type="button"
                        className="bt-btn-save"
                        onClick={onSaveDraft}
                        disabled={isSaving || bars.length === 0}
                    >
                        {isSaving ? (
                            <>
                                <svg className="bt-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                </svg>
                                Đang lưu...
                            </>
                        ) : (
                            <>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
                                </svg>
                                Lưu lyrics
                            </>
                        )}
                    </button>
                    <button
                        type="button"
                        className="bt-btn-export"
                        onClick={onExportLyric}
                        disabled={bars.length === 0}
                    >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Xuất lyric
                    </button>
                </div>
            </div>

            {/* Danh sách */}
            <div className="bt-list">
                {sortedBars.length === 0 ? (
                    <div className="bt-empty">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: '#3a3a5a', marginBottom: 8 }}>
                            <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                        </svg>
                        <span>Chưa có bar nào. Đặt thời gian và nhập nội dung để bắt đầu.</span>
                    </div>
                ) : (
                    sortedBars.map((bar) => (
                        <div
                            key={bar.id}
                            className={`bt-item${activeId === bar.id ? ' bt-item--active' : ''}`}
                        >
                            {activeId === bar.id && (
                                <span className="bt-active-indicator" aria-hidden="true">▶</span>
                            )}
                            <span className="bt-item-time">{formatTime(bar.time)}</span>
                            <span className="bt-item-content">{bar.content}</span>
                            <div className="bt-item-actions">
                                <button
                                    type="button"
                                    className="bt-btn-edit"
                                    onClick={() => onEdit?.(bar)}
                                    title="Sửa bar này"
                                    aria-label={`Sửa bar tại ${formatTime(bar.time)}`}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                </button>
                                <button
                                    type="button"
                                    className="bt-btn-delete"
                                    onClick={() => handleDeleteClick(bar.id)}
                                    title="Xoá bar này"
                                    aria-label={`Xoá bar tại ${formatTime(bar.time)}`}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Quick add tại thời gian hiện tại */}
            {bars.length > 0 && (
                <div className="bt-quick-add-hint">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Thêm bar nhanh tại thời điểm hiện tại
                </div>
            )}

            {/* Footer */}
            <div className="bt-footer">
                {lastSavedAt ? (
                    <span className="bt-saved-info">
                        <span className="bt-saved-dot" aria-hidden="true">●</span>
                        Đã lưu tự động lúc {formatSavedAt(lastSavedAt)}
                    </span>
                ) : (
                    <span className="bt-saved-info bt-saved-info--unsaved">Chưa lưu</span>
                )}
                {bars.length > 0 && (
                    <button
                        type="button"
                        className="bt-btn-delete-all"
                        onClick={() => setConfirmDeleteId('__all__')}
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                        </svg>
                        Xoá tất cả
                    </button>
                )}
            </div>

            {/* Confirm delete modal */}
            {confirmDeleteId && (
                <div className="bt-overlay" role="dialog" aria-modal="true" aria-label="Xác nhận xoá">
                    <div className="bt-confirm">
                        <p className="bt-confirm-text">
                            {confirmDeleteId === '__all__'
                                ? `Xoá toàn bộ ${bars.length} bars?`
                                : 'Xoá bar này?'}
                        </p>
                        <p className="bt-confirm-sub">Hành động này không thể hoàn tác.</p>
                        <div className="bt-confirm-actions">
                            <button type="button" className="bt-confirm-cancel" onClick={() => setConfirmDeleteId(null)}>Huỷ</button>
                            <button type="button" className="bt-confirm-ok" onClick={handleConfirmDelete}>Xoá</button>
                        </div>
                    </div>
                </div>
            )}


        </div>
    );
}