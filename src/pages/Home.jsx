import { useState } from 'react';
import { BannerEvent, Header, Sidebar } from '../components/layout';
import { VideoGrid } from '../components/video';
import { RAGChatBot } from '../components/RAGChatBot';
import { videoService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FaRobot } from 'react-icons/fa';
import './Home.css';

export default function Home() {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isChatbotOpen, setIsChatbotOpen] = useState(false);
    const navigate = useNavigate();


    const { data: videos = [], isLoading, isError, error, refetch } = useQuery({
        queryKey: ['videos'],
        queryFn: async () => {
            const res = await videoService.getAll();
            return res.data ?? [];
        },
        staleTime: Infinity,
    });

    const handleSearch = (query) => {
        setSearchQuery(query);
    };

    const openWatch = (id) => {
        navigate(`/watch/${id}`);
    };

    return (
        console.log("Check videos: ", videos),
        <div className="home-container">
            <Header
                onSearch={handleSearch}
                onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
                isSidebarCollapsed={isSidebarCollapsed}
            />

            <div className="home-content">
                <Sidebar isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed((prev) => !prev)} />

                <main className="home-main-content">
                    {/* <BannerEvent /> */}
                    {isLoading ? (
                        <p className="home-video-status" aria-live="polite">Đang tải video...</p>
                    ) : isError ? (
                        <section className="home-video-status home-video-error" role="alert">
                            <h2>Không tải được dữ liệu video</h2>
                            <p>{error?.message || 'Không kết nối được API backend.'}</p>
                            <p>Hãy chạy backend trước: <code>cd Backend &amp;&amp; npm run dev</code></p>
                            <button type="button" onClick={() => refetch()}>Thử lại</button>
                        </section>
                    ) : (
                        <VideoGrid
                            videos={videos}
                            searchQuery={searchQuery}
                            onVideoSelect={openWatch}
                        />
                    )}
                </main>
            </div>

            <div className="home-chatbot-widget">
                {isChatbotOpen && (
                    <div className="home-chatbot-popover">
                        <RAGChatBot />
                    </div>
                )}
                <button
                    type="button"
                    className="home-chatbot-toggle"
                    onClick={() => setIsChatbotOpen((open) => !open)}
                    aria-label={isChatbotOpen ? 'Đóng chatbot' : 'Mở chatbot'}
                    aria-expanded={isChatbotOpen}
                    title={isChatbotOpen ? 'Đóng chatbot' : 'Mở chatbot'}
                >
                    <FaRobot aria-hidden="true" />
                </button>
            </div>
        </div>
    );
}