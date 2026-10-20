import './VideoCard.css';
import { REACTION_KEY_MAP, REACTIONS_ICONS } from '../../constants/const.js';

export default function VideoCard({ video, onClick }) {
    const formatViews = (views = 0) => {
        if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
        if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
        return views;
    };

    const formatDate = (date) => {
        if (!date) return 'Chưa rõ';
        const now = new Date();
        const videoDate = new Date(date);
        if (Number.isNaN(videoDate.getTime())) return 'Chưa rõ';
        const diffTime = Math.abs(now - videoDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Hôm nay';
        if (diffDays === 1) return 'Hôm qua';
        if (diffDays < 7) return `${diffDays} ngày trước`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng trước`;
        return `${Math.floor(diffDays / 365)} năm trước`;
    };

    const scoreCounts = (video.barScoreCounts ?? [])
        .filter(({ count }) => Number(count) > 0)
        .map(({ range, count }) => ({
            range,
            count,
            reaction: REACTIONS_ICONS.find(
                ({ id }) => id === REACTION_KEY_MAP[range]
            ),
        }))
        .filter(({ reaction }) => reaction);

    return (
        <div className="video-card" onClick={onClick}>
            {/* Thumbnail */}
            <div className="video-thumbnail">
                <img src={video.thumbnailUrl} alt={video.title} />
                <div className="video-duration">{video.duration}</div>
            </div>

            {/* Video Info */}
            <div className="video-info">
                {/* Channel Avatar */}
                {/* <img
                    src={video.channelAvatar || video.thumbnailUrl}
                    alt={video.channel || video.title}
                    className="channel-avatar"
                /> */}

                {/* Video Details */}
                <div className="video-details">
                    <h3 className="video-title" title={video.title}>
                        {video.title}
                    </h3>
                    {scoreCounts.length > 0 && (
                        <div className="video-score-counts">
                            {scoreCounts.map(({ range, count, reaction }) => {
                                const Icon = reaction.icon;

                                return (
                                    <span
                                        className="video-score-count"
                                        key={range}
                                        title={reaction.label}
                                    >
                                        <Icon aria-hidden="true" style={{ color: reaction.color }} />
                                        <span>{count}</span>
                                    </span>
                                );
                            })}
                        </div>
                    )}
                    {/* <p className="channel-name">{video.channel || 'WebbattelRap'}</p>
                    <div className="video-stats">
                        <span>{formatViews(video.views)} lượt xem</span>
                        <span className="separator">•</span>
                        <span>{formatDate(video.uploadedAt || video.createdAt)}</span>
                    </div> */}
                </div>

                {/* Menu Button */}
                <button className="video-menu" title="Tùy chọn">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="12" r="2"></circle>
                        <circle cx="12" cy="5" r="2"></circle>
                        <circle cx="12" cy="19" r="2"></circle>
                    </svg>
                </button>
            </div>
        </div>
    );
}
