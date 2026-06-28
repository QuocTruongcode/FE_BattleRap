import { useState } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import VideoGrid from '../components/VideoGrid';
import { videoService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

export default function Home() {
    const [searchQuery, setSearchQuery] = useState('');
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

    if (isLoading) {
        return <div>Loading...</div>;
    }

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
            <Header onSearch={handleSearch} />

            <div className="home-content">
                <Sidebar />

                <VideoGrid
                    videos={videos}
                    searchQuery={searchQuery}
                    onVideoSelect={openWatch}
                />
            </div>
        </div>
    );
}