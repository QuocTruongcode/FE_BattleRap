import { useState, useEffect, useCallback } from 'react';
import './BarInputPanel.css';
/**
 * BarInputPanel
 * Props:
 *  - currentTime: number (giây, từ VideoPlayer)
 *  - editingBar: { id, time, content } | null  (khi click Sửa từ BarTimeline)
 *  - onAddBar: ({ time, content }) => void
 *  - onUpdateBar: ({ id, time, content }) => void
 *  - onCancelEdit: () => void
 */
export default function BarInputPanel({
    currentTime = 0,
    editingBar = null,
    onAddBar,
    onUpdateBar,
    onCancelEdit,
}) {
    const [lockedTime, setLockedTime] = useState(null);
    const [content, setContent] = useState('');
    const MAX_CHARS = 500;

    // Khi có editingBar từ BarTimeline → điền sẵn dữ liệu
    useEffect(() => {
        if (editingBar) {
            setLockedTime(editingBar.time);
            setContent(editingBar.content);
        }
    }, [editingBar]);

    const formatTime = (secs) => {
        if (secs == null) return '--:--';
        const m = Math.floor(secs / 60);
        const s = (secs % 60).toFixed(2).padStart(5, '0');
        return `${m}:${s}`;
    };

    const handleLockTime = () => {
        setLockedTime(currentTime);
    };

    const handleSubmit = () => {
        if (!content.trim() || lockedTime == null) return;
        if (editingBar) {
            onUpdateBar?.({ id: editingBar.id, time: lockedTime, content: content.trim() });
        } else {
            onAddBar?.({ time: lockedTime, content: content.trim() });
        }
        setContent('');
        setLockedTime(null);
    };

    const handleClear = () => {
        setContent('');
        setLockedTime(null);
        onCancelEdit?.();
    };

    // Phím tắt: Enter = thêm bar, Space không bị chặn
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    }, [content, lockedTime, editingBar]);

    const isEditing = !!editingBar;
    const canSubmit = content.trim().length > 0 && lockedTime != null;

    return (
        <div className="bar-input-panel">
            {/* Header thông tin thời gian */}
            <div className="bip-time-row">
                <div className="bip-time-block">
                    <span className="bip-time-label">Thời gian hiện tại</span>
                    <span className="bip-time-display">{formatTime(currentTime)}</span>
                </div>

                <button
                    type="button"
                    className="bip-btn-lock"
                    onClick={handleLockTime}
                    title="Đặt thời gian tại vị trí hiện tại"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                    </svg>
                    Đặt thời gian
                </button>

                <div className="bip-shortcuts">
                    <span className="bip-shortcut-label">Phím tắt:</span>
                    <span className="bip-shortcut-item"><kbd>Space</kbd> Play/Pause</span>
                    <span className="bip-shortcut-item"><kbd>Enter</kbd> Thêm bar</span>
                    <span className="bip-shortcut-item"><kbd>S</kbd> Lưu nháp</span>
                </div>
            </div>

            {/* Thời gian đã chốt */}
            {lockedTime != null && (
                <div className="bip-locked-time">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                    </svg>
                    Thời gian đã chốt:&nbsp;<strong>{formatTime(lockedTime)}</strong>
                    {isEditing && <span className="bip-editing-badge">Đang sửa bar</span>}
                </div>
            )}

            {/* Textarea nội dung */}
            <div className="bip-content-section">
                <label className="bip-content-label" htmlFor="bar-content-input">
                    Nội dung bar
                </label>
                <textarea
                    id="bar-content-input"
                    className="bip-textarea"
                    placeholder="Nhập nội dung bar tại thời điểm này..."
                    value={content}
                    onChange={(e) => setContent(e.target.value.slice(0, MAX_CHARS))}
                    onKeyDown={handleKeyDown}
                    rows={3}
                />
                <span className="bip-char-count">{content.length}/{MAX_CHARS}</span>
            </div>

            {/* Actions */}
            <div className="bip-actions">
                <button
                    type="button"
                    className="bip-btn-clear"
                    onClick={handleClear}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                    </svg>
                    {isEditing ? 'Huỷ sửa' : 'Xoá nội dung'}
                </button>

                <button
                    type="button"
                    className={`bip-btn-submit${canSubmit ? '' : ' disabled'}`}
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    {isEditing ? 'Cập nhật bar' : 'Thêm bar (Enter)'}
                </button>
            </div>


        </div>
    );
}