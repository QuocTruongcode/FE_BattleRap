import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import ModalReview from '../components/ModalReview';
import EditReview from '../components/EditReview';
import { videoService, reviewService } from '../services/api';
import './VideoCrud.css';
import { useRef } from 'react';

const emptyForm = {
    title: '',
    linkVideo: '',
    thumbnailUrl: '',
    review: '',
};

export default function VideoCrud() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
    const [isOpen, setIsOpen] = useState(false); // state for modal review
    const queryClient = useQueryClient();
    const [reviewContent, setReviewContent] = useState(''); // state for review content
    const formRef = useRef(null);
    const editorRef = useRef(null);



    // ✅ Fetch videos — tự cache, chuyển màn về không gọi lại
    const { data: videos = [], isLoading, isError, error, refetch } = useQuery({
        queryKey: ['videos'],
        queryFn: async () => {
            const res = await videoService.getAll();
            return res.data ?? [];
        },
        staleTime: Infinity, // giữ cache mãi, không tự refetch
    });

    // ✅ Thêm video — xong thì gọi lại API 1 lần để đồng bộ
    const createMutation = useMutation({
        mutationFn: (formData) => videoService.create(formData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['videos'] });
            alert('Thêm video thành công!');
            resetForm();
        },
        onError: () => alert('Thêm video không thành công!'),
    });

    // ✅ Sửa video — cập nhật cache trực tiếp, không gọi lại API
    const updateMutation = useMutation({
        mutationFn: ({ id, formData }) => videoService.update(id, formData),
        onSuccess: (_, { id, formData }) => {
            queryClient.setQueryData(['videos'], (old) =>
                old.map((v) => v.id === id ? { ...v, ...formData } : v)
            );
            alert('Sửa video thành công!');
            resetForm();
        },
        onError: () => alert('Sửa video không thành công!'),
    });

    // ✅ Xóa video — cập nhật cache trực tiếp, không gọi lại API
    const deleteMutation = useMutation({
        mutationFn: (id) => videoService.remove(id),
        onSuccess: (_, id) => {
            queryClient.setQueryData(['videos'], (old) =>
                old.filter((v) => v.id !== id)
            );
            alert('Xoá thành công!');
        },
        onError: () => alert('Xoá không thành công!'),
    });

    // ===== Phần còn lại giữ nguyên =====

    const filteredVideos = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return videos;
        return videos.filter((video) =>
            [video.title, video.linkVideo, video.thumbnailUrl].some((value) =>
                value.toLowerCase().includes(query)
            )
        );
    }, [searchQuery, videos]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((cur) => ({ ...cur, [name]: value }));
    };

    const resetForm = () => {
        setFormData(emptyForm);
        setEditingId(null);
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        const submitter = event.nativeEvent.submitter; // nút vừa được bấm
        const action = submitter?.value; // hoặc dùng name/value tự đặt

        if (action === 'Review') {
            openModalReview();
            return;
        }
        const nextVideo = {
            title: formData.title.trim(),
            linkVideo: formData.linkVideo.trim(),
            thumbnailUrl: formData.thumbnailUrl.trim(),
            review: reviewContent.trim(),
        };
        if (!nextVideo.title || !nextVideo.linkVideo || !nextVideo.thumbnailUrl) return;

        if (editingId) {
            updateMutation.mutate({ id: editingId, formData: nextVideo });
        } else {
            createMutation.mutate(nextVideo);
        }
    };

    const handleOpenEditBar = (video, event) => {
        const target = event?.target;
        if (target?.closest('button') || target?.closest('a')) return;
        navigate(`/edit/${video.id}`);
    };

    const handleEdit = (video, event) => {
        event?.stopPropagation();
        setEditingId(video.id);
        setFormData({
            title: video.title,
            linkVideo: video.linkVideo,
            thumbnailUrl: video.thumbnailUrl,
            review: video.review || '',
        });
    };

    const handleDelete = (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xoá video này?')) return;
        deleteMutation.mutate(id);
    };

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

    const openModalReview = () => {
        if (!formData.linkVideo || !formData.title || !formData.thumbnailUrl) {
            return;
        }
        else {
            setIsOpen(true);
            getReviewContent();
        }
    }

    const getReviewContent = () => {
        if (editingId === null) {
            setReviewContent("Video chưa được thực hiện đánh giá");
        } else {
            setReviewContent(formData.review || "Video chưa được thực hiện đánh giá");
        }
    }

    const handleReviewAi = async () => {
        setReviewContent(null); // reset review content trước khi gọi API
        const IdvideoYt = getYoutubeVideoId(formData.linkVideo);
        if (!IdvideoYt) {
            alert("Link video không hợp lệ. Vui lòng nhập link video YouTube hợp lệ.");
            return;
        }
        const isConfirmed = window.confirm("Bạn có chắc chắn muốn dùng AI để đánh giá video này không?");
        if (!isConfirmed) {
            return; // người dùng bấm Cancel thì dừng lại, không chạy tiếp
        }
        else {
            const res = await reviewService.getReviewsAI(IdvideoYt);
            console.log("Review AI:", res);
            if (!res || !res.textList || res.textList.errCode !== 0) {
                alert("Có lỗi trong quá trình lấy đánh giá từ AI. Vui lòng thử lại sau.");
            }
            else {
                const newContent = res.textList.message || "Không có đánh giá từ AI";
                setReviewContent(newContent);
                editorRef.current?.setMarkdown(newContent); // set trực tiếp vào editor
            }
        }
    };

    // Lấy id từ link youtube, ví dụ: https://www.youtube.com/watch?v=abc123xyz => abc123xyz
    const getYoutubeVideoId = (url) => {
        if (!url) return null;

        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = url.match(regex);

        return match ? match[1] : null;
    }

    const triggerSubmitFromModal = () => {
        formRef.current?.requestSubmit(); // sẽ tự động chạy handleSubmit
        setIsOpen(false); // đóng modal sau khi submit  
    };

    return (
        console.log("reviewContent", reviewContent),
        // console.log("videos:", videos),
        // console.log("check editingId:", editingId),

        <div className="home-container">
            <Header
                onSearch={(query) => setSearchQuery(query)}
                onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
                isSidebarCollapsed={isSidebarCollapsed}
            />
            {/* //modal review */}
            <ModalReview isOpen={isOpen} onClose={() => { setIsOpen(false); setReviewContent(null); }} onReviewAi={() => handleReviewAi()} onSave={() => triggerSubmitFromModal()}>
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
                                    <button type="button" className="secondary-button" onClick={resetForm}>
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
                                    <span>LinkVideo</span>
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

                                    <button type="button" className="ghost-button" onClick={resetForm}>
                                        Làm mới
                                    </button>

                                    <button type="submit" value="Review" className="ghost-button">
                                        Review
                                    </button>
                                </div>
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