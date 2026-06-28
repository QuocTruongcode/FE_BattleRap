import { useParams, useNavigate } from 'react-router-dom';
import VideoPlayer from '../components/VideoPlayer';
export default function EditBar() {
    const { videoId } = useParams();
    const navigate = useNavigate();

    return (
        <div className="home-container">
            <main className="video-crud-page" style={{ padding: '2rem' }}>
                <button
                    type="button"
                    className="ghost-button"
                    onClick={() => navigate('/crud')}
                >
                    ← Quay lại CRUD
                </button>

                <section className="crud-hero" style={{ marginTop: '1.5rem' }}>
                    <VideoPlayer />
                    <p className="crud-eyebrow">Lyric editor</p>
                    <h1>Chỉnh sửa lyric</h1>
                    <p className="crud-description">
                        Video ID: {videoId}
                    </p>
                </section>

                <p>Trang chỉnh sửa lyric đang được phát triển.</p>
            </main>
        </div>
    );
}
