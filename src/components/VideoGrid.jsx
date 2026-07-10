import VideoCard from './VideoCard';
import './VideoGrid.css';

export default function VideoGrid({ videos, searchQuery, onVideoSelect }) {
    const query = searchQuery.toLowerCase();
    const filteredVideos = videos.filter((video) =>
        video.title?.toLowerCase().includes(query) ||
        video.channel?.toLowerCase().includes(query)
    );


    return (
        <div className="video-grid-container">
            {filteredVideos.length > 0 ? (
                <div className="video-grid">
                    {filteredVideos.map((video) => (
                        <VideoCard key={video.id} video={video} onClick={() => onVideoSelect(video.id)} />
                    ))}
                </div>
            ) : (
                <div className="no-results">
                    <p>Không tìm thấy video nào cho "{searchQuery}"</p>
                </div>
            )}
        </div>
    );
}
