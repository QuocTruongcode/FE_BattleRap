import { useParams, useNavigate } from 'react-router-dom';
import './EditBar.css';
import VideoPlayer from '../components/VideoPlayer';
import { videoService, barService } from '../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useRef } from 'react';
import BarInputPanel from '../components/BarInputPanel';
import BarTimeline from '../components/BarTimeline';
/**
 * EditBar page
 * Layout: 2 cột
 *  - Trái:  VideoPlayer + BarInputPanel (bên dưới)
 *  - Phải:  BarTimeline
 *
 * State flow:
 *  - bars đã lưu: fetch từ API qua React Query
 *  - pendingBars: local state (chưa gọi API)
 *  - Lưu nháp: gộp pendingBars → gọi barService.bulkCreate → invalidate query
 */
export default function EditBar() {
    const { videoId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const videoPlayerRef = useRef(null);


    // ── State ────────────────────────────────────────────────────────────────
    const [currentTime, setCurrentTime] = useState(0);
    const [editingBar, setEditingBar] = useState(null);   // bar đang sửa
    const [pendingBars, setPendingBars] = useState([]);   // bars chưa lưu (local)
    const [lastSavedAt, setLastSavedAt] = useState(null);

    // ── Query: video ──────────────────────────────────────────────────────────
    const { data: video, isLoading: videoLoading } = useQuery({
        queryKey: ['video', videoId],
        queryFn: async () => {
            const res = await videoService.getById(videoId);
            return res.data;
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
    });

    // ── Query: bars đã lưu ────────────────────────────────────────────────────
    const { data: savedBars = [] } = useQuery({
        queryKey: ['bars', videoId],
        queryFn: async () => {
            const res = await barService.getBarByVideoId(videoId);
            return res.data.map(bar => ({
                ...bar,
                time: bar.startTime, // mapping startTime → time
            }));
        },
        enabled: !!videoId,
        staleTime: 2 * 60 * 1000,
    });

    // Merge bars: saved + pending (pending có thể override saved nếu cùng id)
    const allBars = [
        ...savedBars.filter(sb => !pendingBars.some(pb => pb.id === sb.id)),
        ...pendingBars,
    ];

    // ── Mutation: lưu nháp (bulk create/update) ───────────────────────────────
    const saveMutation = useMutation({
        mutationFn: async (bars) => {
            console.log("Saving bars to API:", bars);
            return barService.create(bars);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bars', videoId] });
            setPendingBars([]);
            setLastSavedAt(new Date());
        },
        onError: (error) => {
            alert('Lưu thất bại, vui lòng thử lại!');
            // hoặc hiển thị toast thông báo lỗi cho user
        },
    });

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleTimeUpdate = useCallback((time) => {
        setCurrentTime(time);
    }, []);

    // Thêm bar mới → vào pendingBars
    const handleAddBar = useCallback(({ time, content }) => {
        const newBar = {
            id: `pending_${Date.now()}`,
            time,
            content,
            isPending: true,
            videoId: videoId,
        };
        setPendingBars(prev => [...prev, newBar]);
    }, []);

    const handleEdit = useCallback((bar) => {
        setEditingBar(bar);
        videoPlayerRef.current?.seekTo(bar.time); // seek video đến time của bar
    }, []);

    // Cập nhật bar (từ edit flow) → update trong đúng list
    const handleUpdateBar = useCallback(async ({ id, time, content }) => {
        const isSaved = savedBars.some(b => b.id === id);
        if (isSaved) {
            try {
                const res = await barService.update(id, { startTime: time, content, videoId: videoId });
                console.log("API update result:", res);
                // Cập nhật trực tiếp cache, không cần gọi lại API
                queryClient.setQueryData(['bars', videoId], (oldData = []) =>
                    oldData.map(b => b.id === id ? { ...b, time, content } : b)
                );

            } catch (error) {
                console.error("Failed to update bar via API:", error);
                alert('Cập nhật bar thất bại, vui lòng thử lại!');
            }

        } else {
            setPendingBars(prev =>
                prev.map(b => b.id === id ? { ...b, time, content } : b)
            );
        }
        setEditingBar(null);
    }, [savedBars, videoId, queryClient]);

    // Xoá bar
    const handleDelete = useCallback(async (id) => {
        const isSaved = savedBars.some(b => b.id === id);
        if (isSaved) {
            // TODO: gọi barService.delete(id) nếu muốn xoá ngay
            try {
                const res = await barService.deleteBar(id);
                console.log("API delete result:", res);
                if (res.success) {
                    setPendingBars(prev => [
                        ...prev.filter(b => b.id !== id),
                        { id, _deleted: true },
                    ]);
                }
            } catch (error) {
                alert('Xoá bar thất bại, vui lòng thử lại!');
            }
            // Hiện tại: đánh dấu deleted trong pending

        } else {
            setPendingBars(prev => prev.filter(b => b.id !== id));
        }
    }, [savedBars]);

    // Xoá tất cả pending + tất cả saved (cần gọi API)
    const handleDeleteAll = useCallback(async (id) => {
        if (id === '__all__') {
            const isSaved = savedBars.some(b => b.id === id);
            if (!isSaved) {
                setPendingBars([]);
                return;
            } else {
                try {
                    const res = await barService.deleteAllBarByVideoId(videoId);
                    queryClient.setQueryData(['bars', videoId], []);

                } catch (error) {
                    alert('Xoá tất cả bars thất bại, vui lòng thử lại!');
                }
            }

            // TODO: barService.deleteAll(videoId) nếu cần
        } else {
            handleDelete(id);
        }
    }, [handleDelete, videoId, queryClient]);

    // Lưu nháp → gọi API
    const handleSaveDraft = useCallback(() => {
        const toSave = pendingBars.filter(b => !b._deleted);
        if (!toSave.length) return;
        console.log("Saving draft bars:", toSave);
        saveMutation.mutate(toSave);
    }, [pendingBars, saveMutation]);

    // Xuất lyric
    const handleExportLyric = useCallback(() => {
        const text = [...allBars]
            .filter(b => !b._deleted)
            .sort((a, b) => a.time - b.time)
            .map(b => `[${formatTime(b.time)}] ${b.content}`)
            .join('\n');
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lyric_video_${videoId}.lrc`;
        a.click();
        URL.revokeObjectURL(url);
    }, [allBars, videoId]);

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60);
        const s = (secs % 60).toFixed(2).padStart(5, '0');
        return `${m}:${s}`;
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        console.log("Check pendingBars:", pendingBars),
        <div className="edit-bar-page">
            {/* Top bar */}
            <div className="edit-bar-topbar">
                <button
                    type="button"
                    className="edit-bar-back"
                    onClick={() => navigate(-1)}
                >
                    ← Quay lại
                </button>
                <div className="edit-bar-title-block">
                    <h1 className="edit-bar-title">Chỉnh sửa lyric (Edit Bar)</h1>
                    {video && (
                        <span className="edit-bar-subtitle">
                            Video ID: {videoId} – {video.title}
                        </span>
                    )}
                </div>
                <div className="edit-bar-topbar-actions">
                    <button
                        type="button"
                        className="edit-bar-btn-draft"
                        onClick={handleSaveDraft}
                        disabled={saveMutation.isPending || !pendingBars.filter(b => !b._deleted).length}
                    >
                        {saveMutation.isPending ? 'Đang lưu...' : '💾 Lưu nháp'}
                    </button>
                    <button
                        type="button"
                        className="edit-bar-btn-export"
                        onClick={handleExportLyric}
                        disabled={!allBars.filter(b => !b._deleted).length}
                    >
                        ✦ Xuất lyric
                    </button>
                </div>
            </div>

            {/* Main layout */}
            <div className="edit-bar-layout">
                {/* Cột trái: video + input */}
                <div className="edit-bar-left">
                    <VideoPlayer
                        ref={videoPlayerRef}
                        videoUrl={video?.linkVideo}
                        onTimeUpdate={handleTimeUpdate}
                    />
                    <BarInputPanel
                        currentTime={currentTime}
                        editingBar={editingBar}
                        onAddBar={handleAddBar}
                        onUpdateBar={handleUpdateBar}
                        onCancelEdit={() => setEditingBar(null)}
                    />
                </div>

                {/* Cột phải: danh sách bars */}
                <div className="edit-bar-right">
                    <BarTimeline
                        bars={allBars.filter(b => !b._deleted)}
                        currentTime={currentTime}
                        onEdit={handleEdit}
                        onDelete={handleDeleteAll}
                        onSaveDraft={handleSaveDraft}
                        onExportLyric={handleExportLyric}
                        isSaving={saveMutation.isPending}
                        lastSavedAt={lastSavedAt}
                        videoTitle={video?.title}
                        videoId={videoId}
                    />
                </div>
            </div>
        </div>
    );
}