import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { videoService } from '../services/api';

const emptyForm = {
    title: '',
    linkVideo: '',
    thumbnailUrl: '',
};

export default function VideoCrud() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);

    const queryClient = useQueryClient();

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
        const nextVideo = {
            title: formData.title.trim(),
            linkVideo: formData.linkVideo.trim(),
            thumbnailUrl: formData.thumbnailUrl.trim(),
        };
        if (!nextVideo.title || !nextVideo.linkVideo || !nextVideo.thumbnailUrl) return;

        if (editingId) {
            updateMutation.mutate({ id: editingId, formData: nextVideo });
        } else {
            createMutation.mutate(nextVideo);
        }
    };

    const handleEdit = (video) => {
        setEditingId(video.id);
        setFormData({
            title: video.title,
            linkVideo: video.linkVideo,
            thumbnailUrl: video.thumbnailUrl,
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


    return (
        <div className="home-container">
            <Header onSearch={(query) => setSearchQuery(query)} />
            <div className="home-content">
                <Sidebar />

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

                            <form className="crud-form" onSubmit={handleSubmit}>
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
                                        <article className="video-row" key={video.id} onClick={() => navigate(`/edit/${video.id}`)}>
                                            <img className="video-thumb" src={video.thumbnailUrl} alt={video.title} />

                                            <div className="video-row-content">
                                                <h3 title={video.title}>{video.title}</h3>
                                                <a href={video.linkVideo} target="_blank" rel="noreferrer">
                                                    {video.linkVideo}
                                                </a>
                                                <p>{video.thumbnailUrl}</p>
                                            </div>

                                            <div className="row-actions">
                                                <button type="button" className="secondary-button" onClick={() => handleEdit(video)}>
                                                    Sửa
                                                </button>
                                                <button
                                                    type="button"
                                                    className="danger-button"
                                                    onClick={() => handleDelete(video.id)}
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