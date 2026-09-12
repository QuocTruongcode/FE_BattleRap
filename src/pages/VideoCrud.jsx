import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, Sidebar } from '../components/layout';
import { ModalReview, EditReview } from '../components/review';
import { useVideoCrudForm } from '../hooks/useVideoCrudForm';
import { useVideoCrudQueries } from '../hooks/useVideoCrudQueries';
import { useVideoReview } from '../hooks/useVideoReview';
import './VideoCrud.css';
import { searchBattler, Video_battler } from '../services/api';
import BattlerTag from '../components/battler/BattlerTag';

export default function VideoCrud() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [battlerSearch, setBattlerSearch] = useState('');
    const [battlerResults, setBattlerResults] = useState([]);
    const [selectedBattlers, setSelectedBattlers] = useState([]);
    const formRef = useRef(null);

    const {
        formData,
        editingId,
        handleChange,
        resetForm,
        startEdit,
    } = useVideoCrudForm();

    const {
        videos,
        filteredVideos,
        isLoading,
        isError,
        error,
        refetch,
        createMutation,
        updateMutation,
        deleteMutation,
    } = useVideoCrudQueries(searchQuery);

    const {
        isOpen,
        setIsOpen,
        reviewContent,
        setReviewContent,
        editorRef,
        isAnalyzing,
        progressMessage,
        openModalReview,
        handleReviewAi,
        triggerSubmitFromModal,
        handleCancel,
    } = useVideoReview();

    const handleSubmit = (event) => {
        event.preventDefault();

        const submitter = event.nativeEvent.submitter;
        const action = submitter?.value;

        if (action === 'Review') {
            openModalReview({ formData, editingId });
            return;
        }

        const nextVideo = {
            title: formData.title.trim(),
            linkVideo: formData.linkVideo.trim(),
            linkBunny: formData.linkBunny.trim(),
            thumbnailUrl: formData.thumbnailUrl.trim(),
            review: reviewContent.trim(),
        };


        if (!nextVideo.title || !nextVideo.linkVideo || !nextVideo.thumbnailUrl) return;

        if (editingId) {
            updateMutation.mutate({ id: editingId, formData: nextVideo });
            handleResetForm();
        } else {
            createMutation.mutate(nextVideo);
            handleResetForm();
        }
    };

    const handleOpenEditBar = (video, event) => {
        const target = event?.target;
        if (target?.closest('button') || target?.closest('a')) return;
        navigate(`/edit/${video.id}`);
    };

    const handleEdit = (video, event) => {
        event?.stopPropagation();
        startEdit(video);
    };

    const handleDelete = (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xoá video này?')) return;
        deleteMutation.mutate(id);
    };

    const getBattlerId = (battler) => {
        return battler?.battlerId ?? battler?.BattlerId ?? battler?.BattlerID ?? battler?.battler?.id ?? battler?.Battler?.id ?? battler?.id ?? null;
    };

    const getVideoBattlerId = (battler) => {
        return battler?.videoBattlerId ?? battler?.VideoBattlerId ?? battler?.VideoBattlerID ?? battler?.video_battler_id ?? battler?.id ?? null;
    };

    const normalizeBattler = (battler) => {
        const rawBattler = battler?.battler || battler?.Battler || battler || {};
        const battlerId = getBattlerId({ ...rawBattler, ...battler });

        return {
            ...rawBattler,
            ...battler,
            id: battlerId,
            battlerId,
        };
    };

    const resetBattlerState = () => {
        setBattlerSearch('');
        setBattlerResults([]);
        setSelectedBattlers([]);
    };

    const handleResetForm = () => {
        resetForm();
        resetBattlerState();
    };

    const handleBattlerSelect = async (battler) => {
        if (!editingId) return;

        const battlerId = getBattlerId(battler);
        if (!battlerId) return;

        try {
            const created = await Video_battler.create({
                videoID: editingId,
                battlerID: battlerId,
            });

            const createdRecord = created?.data ?? created;
            const nextBattler = normalizeBattler({
                ...battler,
                ...createdRecord,
                battlerId,
                videoBattlerId: createdRecord?.id ?? createdRecord?.videoBattlerId ?? createdRecord?.VideoBattlerId ?? createdRecord?.video_battler_id ?? null,
            });

            setSelectedBattlers((current) => {
                const exists = current.some((item) => getBattlerId(item) === String(battlerId));
                if (exists) return current;

                return [...current, nextBattler];
            });
        } catch (error) {
            console.error('Create video battler error:', error);
        }
    };

    const handleBattlerRemove = async (battler) => {
        if (!editingId) return;

        const battlerId = getBattlerId(battler);
        if (!battlerId) return;

        const previousSelected = selectedBattlers;
        const normalizedBattlerId = String(battlerId);

        setSelectedBattlers((current) =>
            current.filter((item) => String(getBattlerId(item) ?? '') !== normalizedBattlerId)
        );

        try {
            await Video_battler.remove(editingId, battlerId);
        } catch (error) {
            console.error('Remove video battler error:', error);
            setSelectedBattlers(previousSelected);
            alert('Xóa battler khỏi video thất bại. Vui lòng thử lại.');
        }
    };

    useEffect(() => {
        if (!editingId) {
            setSelectedBattlers([]);
            return;
        }

        let isMounted = true;

        Video_battler.getBattlerByVideoId(editingId)
            .then((result) => {
                const list = Array.isArray(result?.data)
                    ? result.data
                    : Array.isArray(result)
                        ? result
                        : [];

                if (!isMounted) return;

                const normalized = list.map((item) => {
                    const battler = item?.battler || item?.Battler || item;
                    return normalizeBattler({ ...battler, ...item, battlerId: battler?.id ?? item?.battlerId ?? item?.BattlerId ?? item?.BattlerID });
                });

                setSelectedBattlers(normalized.slice(0, 2));
            })
            .catch((error) => {
                console.error('Get battlers by video error:', error);
                if (isMounted) setSelectedBattlers([]);
            });

        return () => {
            isMounted = false;
        };
    }, [editingId]);

    useEffect(() => {
        const keyword = battlerSearch.trim();

        if (!keyword) {
            setBattlerResults([]);
            return;
        }

        const timer = setTimeout(() => {
            searchBattler
                .search(keyword)
                .then((result) => {
                    const list = Array.isArray(result?.data)
                        ? result.data
                        : Array.isArray(result)
                            ? result
                            : [];
                    setBattlerResults(list);
                })
                .catch((error) => {
                    console.error('Search battler error:', error);
                    setBattlerResults([]);
                });
        }, 400);

        return () => clearTimeout(timer);
    }, [battlerSearch]);

    if (isLoading) return <div>Đang tải...</div>;

    if (isError) {
        return (
            <div className="home-container" style={{ padding: '2rem' }}>
                <h2>Không tải được dữ liệu video</h2>
                <p>{error?.message || 'Không kết nối được API backend.'}</p>
                <p>Hãy chạy backend trước: <code>cd Backend &amp;&amp; npm run dev</code></p>
                <button type="button" onClick={() => refetch()}>Thử lại</button>
            </div>
        );
    }

    return (
        console.log("Editing ID:", editingId),
        <div className="home-container">
            <Header
                onSearch={(query) => setSearchQuery(query)}
                onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
                isSidebarCollapsed={isSidebarCollapsed}
            />
            {/* //modal review */}
            <ModalReview isOpen={isOpen} onClose={() => { setIsOpen(false); setReviewContent(null); }}
                onReviewAi={() => handleReviewAi({ formData })} onSave={() => triggerSubmitFromModal(formRef)}
                isAnalyzing={isAnalyzing} progressMessage={progressMessage} onCancel={handleCancel}>
                <EditReview ref={editorRef}
                    markdown={reviewContent} onChange={setReviewContent} />
            </ModalReview>
            {/* //modal review */}

            <div className="home-content">
                <Sidebar isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed((prev) => !prev)} />

                <main className="video-crud-page">
                    <div className="crud-topbar">
                        <button type="button" className="ghost-button" onClick={() => navigate('/')}>
                            ← Quay lại trang chủ
                        </button>
                    </div>

                    <section className="crud-hero">
                        <div>
                            <p className="crud-eyebrow">Video management</p>
                            <h1>CRUD Video</h1>
                            <p className="crud-description">
                                Quản lý danh sách video với các trường Title, LinkVideo và thumbnailUrl.
                            </p>
                        </div>

                        <div className="crud-stats">
                            <article>
                                <span>{videos.length}</span>
                                <small>Tổng video</small>
                            </article>
                            <article>
                                <span>{filteredVideos.length}</span>
                                <small>Kết quả lọc</small>
                            </article>
                        </div>
                    </section>

                    <div className="crud-layout">
                        <section className="crud-panel form-panel">
                            <div className="panel-header">
                                <div>
                                    <p className="panel-kicker">{editingId ? 'Update record' : 'Create record'}</p>
                                    <h2>{editingId ? 'Chỉnh sửa video' : 'Thêm video mới'}</h2>
                                </div>

                                {editingId ? (
                                    <button type="button" className="secondary-button" onClick={handleResetForm}>
                                        Hủy sửa
                                    </button>
                                ) : null}
                            </div>

                            <div className="crud-search">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(event) => setSearchQuery(event.target.value)}
                                    placeholder="Tìm kiếm video theo title, link hoặc thumbnail"
                                />
                            </div>

                            <form className="crud-form" onSubmit={handleSubmit} ref={formRef}>
                                <label>
                                    <span>Title</span>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        placeholder="Nhập tiêu đề video"
                                        required
                                    />
                                </label>

                                <label>
                                    <span>Link Video</span>
                                    <input
                                        type="url"
                                        name="linkVideo"
                                        value={formData.linkVideo}
                                        onChange={handleChange}
                                        placeholder="https://..."
                                        required
                                    />
                                </label>

                                <label>
                                    <span>Link Bunny</span>
                                    <input
                                        type="url"
                                        name="linkBunny"
                                        value={formData.linkBunny}
                                        onChange={handleChange}
                                        placeholder="https://..."
                                    />
                                </label>

                                <label>
                                    <span>thumbnailUrl</span>
                                    <input
                                        type="url"
                                        name="thumbnailUrl"
                                        value={formData.thumbnailUrl}
                                        onChange={handleChange}
                                        placeholder="https://..."
                                        required
                                    />
                                </label>

                                <div className="form-actions">
                                    <button type="submit" className="primary-button">
                                        {editingId ? 'Cập nhật video' : 'Thêm video'}
                                    </button>

                                    <button type="button" className="ghost-button" onClick={handleResetForm}>
                                        Làm mới
                                    </button>

                                    <button type="submit" value="Review" className="ghost-button-review">
                                        Review
                                    </button>
                                </div>

                                {editingId ? (
                                    <>
                                        <div className="battler-search-row">
                                            <div className="battler-search-field">
                                                <label>
                                                    <span>Search Battler</span>
                                                    <input
                                                        type="text"
                                                        value={battlerSearch}
                                                        onChange={(event) => setBattlerSearch(event.target.value)}
                                                        placeholder="Nhập tên battler..."
                                                    />
                                                </label>

                                                <div className="battler-tag-result">
                                                    {battlerResults.length > 0 ? (
                                                        battlerResults.map((battler) => (
                                                            <BattlerTag
                                                                key={getBattlerId(battler) ?? `${battler.FullName}-${battler.RapName}`}
                                                                image={battler.image}
                                                                alt={battler.FullName || 'Battler'}
                                                                type="Battler"
                                                                title={battler.RapName || 'Unnamed battler'}
                                                                artist={battler.FullName || 'Unknown name'}
                                                                meta="Battler search result"
                                                                description={battler.Describe || 'Chưa có mô tả'}
                                                                onClick={() => handleBattlerSelect(battler)}
                                                            />
                                                        ))
                                                    ) : (
                                                        <div className="battler-tag-empty">
                                                            <p>Nhập tên battler để tìm kiếm.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="battler-selected-stack">
                                            <p className="panel-kicker">Selected battlers</p>
                                            {selectedBattlers.length > 0 ? (
                                                selectedBattlers.map((battler) => (
                                                    <BattlerTag
                                                        key={getBattlerId(battler) ?? `${battler.FullName}-${battler.RapName}`}
                                                        image={battler.image}
                                                        alt={battler.FullName || 'Battler'}
                                                        type="Battler"
                                                        title={battler.RapName || 'Unnamed battler'}
                                                        artist={battler.FullName || 'Unknown name'}
                                                        meta="Video battler"
                                                        description={battler.Describe || 'Chưa có mô tả'}
                                                        showRemoveButton
                                                        onRemove={() => handleBattlerRemove(battler)}
                                                    />
                                                ))
                                            ) : (
                                                <div className="battler-tag-empty">
                                                    <p>Chưa có battler nào được gắn với video này.</p>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : null}
                            </form>
                        </section>

                        <section className="crud-panel list-panel">
                            <div className="panel-header">
                                <div>
                                    <p className="panel-kicker">Video list</p>
                                    <h2>Danh sách video</h2>
                                </div>
                            </div>

                            <div className="video-list">
                                {filteredVideos.length > 0 ? (
                                    filteredVideos.map((video) => (
                                        <article className="video-row" key={video.id} onClick={(event) => handleOpenEditBar(video, event)}>
                                            <img className="video-thumb" src={video.thumbnailUrl} alt={video.title} />

                                            <div className="video-row-content">
                                                <h3 title={video.title}>{video.title}</h3>
                                                <a href={video.linkVideo} target="_blank" rel="noreferrer">
                                                    {video.linkVideo}
                                                </a>
                                                <p>{video.thumbnailUrl}</p>
                                            </div>

                                            <div className="row-actions">
                                                <button type="button" className="secondary-button" onClick={(event) => handleEdit(video, event)}>
                                                    Sửa
                                                </button>
                                                <button
                                                    type="button"
                                                    className="danger-button"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        handleDelete(video.id);
                                                    }}
                                                >
                                                    Xóa
                                                </button>
                                            </div>
                                        </article>
                                    ))
                                ) : (
                                    <div className="empty-state">
                                        <h3>Không có video phù hợp</h3>
                                        <p>Thử xóa bộ lọc tìm kiếm hoặc thêm một video mới.</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );

}